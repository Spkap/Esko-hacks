"""Versioned exact comparisons, not a legal compliance determination."""

import re
import unicodedata
from decimal import Decimal

VERSION = "wavelength-core-v1"
UNITS = {
    "ml": ("volume", "1"),
    "l": ("volume", "1000"),
    "g": ("mass", "1"),
    "kg": ("mass", "1000"),
    "oz": ("mass", "28.349523125"),
    "fl oz": ("volume", "29.5735295625"),
}
QUANTITY = re.compile(
    r"(?<![\w.])([0-9]+(?:\.[0-9]+)?)\s*(fl\s*oz|ml|kg|oz|g|l)(?![a-z])", re.I
)


def normalize(text):
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", text)).casefold()


def juice_applicability(spec):
    """Only classifies the supplied threshold; establishes no legal obligation."""
    value = spec.get("juicePercent")
    if (
        spec.get("measurementBasis") != "volume"
        or isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not 0 <= value <= 100
    ):
        return "uncertain"
    return "applicable" if value < 5 else "not_applicable"


def equivalent(value, unit, expected):
    a, b = UNITS.get(unit.lower()), UNITS.get(expected["unit"].lower())
    if not a or not b or a[0] != b[0]:
        return None
    return abs(
        Decimal(str(value)) * Decimal(a[1])
        - Decimal(str(expected["value"])) * Decimal(b[1])
    ) < Decimal("0.000001")


def evaluate_run(artwork, references, run):
    checks = []
    selected = run.get("selectedRuleIds", [])
    pages = artwork.get("pages", [])
    text = artwork.get("text", "")
    specs = [
        r
        for r in references
        if r.get("role") in ("product_specification", "company_policy")
    ]

    def reliable_source(ref):
        extraction = ref.get("extraction", {})
        return (
            ref.get("approvalStatus") == "approved"
            and extraction.get("readingStatus") == "read"
            and not extraction.get("conflicts")
            and not extraction.get("qualifiers")
        )

    def add(
        rule,
        title,
        result="needs_review",
        observed="Unknown",
        expected="Qualified source required",
        reason="No unambiguous approved structured reference is available.",
        ref=None,
        location="",
        excerpt="",
        match=None,
        applicability=None,
    ):
        evidence = {
            "artworkVersionId": artwork["id"],
            "page": match[0] if match else 1,
            "inspectedPanels": f"{len(pages)} supplied page(s); whole-package coverage is not inferred",
            "sourceId": ref["id"] if ref else "",
            "sourceLocation": location,
            "excerpt": excerpt,
        }
        if match and match[1].get("region"):
            evidence["region"] = match[1]["region"]
        checks.append(
            {
                "id": f"{run['id']}:{rule}:{len(checks)}",
                "runId": run["id"],
                "ruleId": rule,
                "ruleVersion": VERSION,
                "title": title,
                "kind": {
                    "company_policy": "brand",
                    "regulatory_reference": "regulatory",
                }.get(ref.get("role") if ref else None, "product_data"),
                "applicability": applicability or ("applicable" if result in ("pass", "fail") else "uncertain"),
                "result": result,
                "observed": observed,
                "expected": expected,
                "suggestedCorrection": "Review source and artwork evidence."
                if result != "pass"
                else "No correction indicated by this comparison.",
                "reason": reason,
                "evidence": evidence,
            }
        )

    def locate(needle):
        for i, p in enumerate(pages):
            for s in p.get("spans", []):
                if (
                    normalize(needle) in normalize(s["text"])
                    and s.get("confidence", 0) >= 0.8
                ):
                    return i + 1, s
        return None

    for rule in selected:
        if run.get("ruleSetVersion") != VERSION:
            add(rule, rule, reason="Unsupported rule set version.")
            continue
        if rule == "net-quantity":
            sources = [
                r
                for r in specs
                if r["extraction"].get("specification", {}).get("netQuantity")
            ]
            if len(sources) != 1:
                add(rule, "Net quantity")
                continue
            ref = sources[0]
            expected = ref["extraction"]["specification"]["netQuantity"]
            quantities = list(QUANTITY.finditer(unicodedata.normalize("NFKC", text)))
            contextual = [
                m
                for m in quantities
                if re.search(
                    r"net\s*(?:quantity|weight|contents?)?\s*[:：]?\s*$",
                    text[max(0, m.start() - 30) : m.start()],
                    re.I,
                )
            ]
            if contextual:
                quantities = contextual
            found = [
                (m, equivalent(m[1], re.sub(r"\s+", " ", m[2].lower()), expected))
                for m in quantities
            ]
            matched = [(m, v, locate(m[0])) for m, v in found]
            reliable = [m for m in matched if m[2] and m[1] is not None]
            result = "needs_review"
            reason = "Quantity is absent, ambiguous, incompatible, or lacks reliable located evidence."
            if (
                reliable
                and len(reliable) == len(found)
                and all(v is True for _, v, _ in reliable)
            ):
                result = "pass"
                reason = "All reliably located compatible quantities match the approved specification."
            elif (
                reliable
                and len(reliable) == len(found)
                and all(v is False for _, v, _ in reliable)
            ):
                result = "fail"
                reason = (
                    "Reliably located quantity differs from the approved specification."
                )
            if not reliable_source(ref):
                result = "needs_review"
                reason = "The supplied reference is draft, unapproved, partial, or conflicting. Confirm its authority before deciding this comparison."
            add(
                rule,
                "Net quantity",
                result,
                ", ".join(m[0] for m in quantities) or "Not located",
                f"{expected['value']} {expected['unit']}",
                reason,
                ref,
                expected.get("location", "$.product.netQuantity"),
                str(expected),
                reliable[0][2] if reliable else None,
            )
        elif rule == "required-statements":
            sources = [r for r in specs if r["extraction"].get("requirements")]
            if not sources:
                add(rule, "Required statements")
                continue
            for ref in sources:
                for index, req in enumerate(ref["extraction"]["requirements"]):
                    alternatives = req.get("anyOf", [req["text"]])
                    match = next((located for value in alternatives if (located := locate(value))), None)
                    present = any(normalize(value) in normalize(text) for value in alternatives)
                    applicability = "applicable"
                    condition = req.get("appliesWhen")
                    if condition:
                        products = [r for r in references if r.get("role") == "product_specification" and reliable_source(r)]
                        spec = products[0]["extraction"].get("specification", {}) if len(products) == 1 else {}
                        applicability = "uncertain"
                        context_matches = all(normalize(run.get(key, "")) == normalize(condition[key]) for key in ("market", "category") if key in condition)
                        context_known = all(run.get(key) for key in ("market", "category") if key in condition)
                        if context_known and not context_matches:
                            applicability = "not_applicable"
                        elif context_known and context_matches:
                            if "juiceBelowPercent" in condition:
                                # Supplied policy threshold; never an inferred regulatory obligation.
                                value = spec.get("juicePercent")
                                if spec.get("measurementBasis") == condition.get("measurementBasis") == "volume" and isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= value <= 100:
                                    applicability = "applicable" if value < condition["juiceBelowPercent"] else "not_applicable"
                            else:
                                applicability = "applicable"
                    complete = (
                        ref["extraction"].get("specification", {}).get("completePanels") is True
                        and artwork.get("completeCoverage") is True
                        and artwork.get("readingStatus") == "read"
                    )
                    result = "pass" if match else ("fail" if complete and not present else "needs_review")
                    reason = ("An accepted literal disclosure was located." if match else
                              "All accepted disclosures are absent from declared complete supplied native text panels; unseen panels remain outside scope." if complete else
                              "Absence requires complete readable panel coverage; review manually.")
                    if applicability == "not_applicable":
                        result, reason = "not_checked", "The supplied policy condition does not apply to this product composition or declared market/category."
                    elif applicability == "uncertain":
                        result, reason = "needs_review", "Policy applicability needs an unambiguous approved product specification, known measurement basis, and declared market/category."
                    if not reliable_source(ref):
                        result, applicability, reason = "needs_review", "uncertain", "The supplied requirement is draft, unapproved, partial, or conflicting."
                    add(
                        rule, req.get("title", req["id"]), result,
                        match[1]["text"] if match else "Not located in supplied readable text",
                        " OR ".join(alternatives), reason, ref,
                        f"$.requiredStatements[{index}]", str(req), match,
                        applicability=applicability if result != "needs_review" else "uncertain",
                    )
        elif rule == "physical-type-size":
            add(
                rule,
                "Physical type size",
                reason="Extracted pixels or PDF text transforms cannot establish compliant printed type size without qualified physical scale and applicability.",
            )
        else:
            add(rule, rule, result="not_checked", reason="Unsupported rule identifier.")
    for ref in references:
        if ref.get("role") == "regulatory_reference":
            add(
                "regulatory-applicability",
                "Regulatory applicability",
                ref=ref,
                location="Document",
                excerpt=ref.get("extraction", {}).get("text", "")[:300],
                reason="Regulatory source interpretation and product applicability require qualified review; no legal conclusion is inferred.",
            )
    return {
        "checks": checks,
        "reviewedScope": "Literal approved-source comparisons on supplied extracted pages. No whole-package or legal compliance determination.",
        "uncheckedRequirements": [
            "Physical printed type size",
            "Qualified regulatory applicability",
            "Unseen or unreadable panels",
        ],
    }
