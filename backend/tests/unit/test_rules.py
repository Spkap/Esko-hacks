from app.verification.rules import evaluate_run, equivalent, juice_applicability


def test_units_and_thresholds():
    assert equivalent(1, "l", {"value": 1000, "unit": "mL"})
    assert equivalent(1, "kg", {"value": 1000, "unit": "g"})
    assert equivalent(1, "g", {"value": 1, "unit": "mL"}) is None
    assert [
        juice_applicability({"juicePercent": v, "measurementBasis": "volume"})
        for v in (0, 2, 5)
    ] == ["applicable", "applicable", "not_applicable"]
    assert juice_applicability({"juicePercent": 2}) == "uncertain"


def fixture(text="250 mL", approved="approved"):
    region = {"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.1}
    artwork = {
        "id": "a",
        "text": text,
        "readingStatus": "read",
        "pages": [
            {"text": text, "spans": [{"text": text, "confidence": 1, "region": region}]}
        ],
    }
    reference = {
        "id": "r",
        "role": "product_specification",
        "approvalStatus": approved,
        "extraction": {
            "method": "structured-json-v1",
            "readingStatus": "read",
            "specification": {
                "netQuantity": {"value": 250, "unit": "mL"},
                "completePanels": True,
            },
            "requirements": [{"id": "q", "text": "required"}],
        },
    }
    run = {
        "id": "run",
        "ruleSetVersion": "wavelength-core-v1",
        "selectedRuleIds": [
            "net-quantity",
            "required-statements",
            "physical-type-size",
        ],
    }
    return artwork, [reference], run


def test_changed_artwork_changes_result():
    assert evaluate_run(*fixture())["checks"][0]["result"] == "pass"
    assert evaluate_run(*fixture("500 mL"))["checks"][0]["result"] == "fail"
    assert (
        evaluate_run(*fixture(approved="draft"))["checks"][0]["result"]
        == "needs_review"
    )


def test_missing_and_incomplete_never_empty_pass():
    a, r, run = fixture()
    assert evaluate_run(a, [], run)["checks"][0]["result"] == "needs_review"
    assert evaluate_run(a, r, run)["checks"][1]["result"] == "needs_review"
    r[0]["extraction"]["conflicts"] = ["conflict"]
    assert evaluate_run(a, r, run)["checks"][0]["result"] == "needs_review"


def test_complete_supplied_panel_absence_and_present_statement():
    a, r, run = fixture("Net quantity: 250 mL")
    a["completeCoverage"] = True
    report = evaluate_run(a, r, run)
    assert report["checks"][0]["result"] == "pass"
    assert report["checks"][1]["result"] == "fail"
    a["text"] = "Net quantity: 250 mL required"
    a["pages"][0]["spans"][0]["text"] = a["text"]
    assert evaluate_run(a, r, run)["checks"][1]["result"] == "pass"


def test_unlocated_conflicting_quantity_cannot_pass():
    artwork, refs, run = fixture("Net content 250 mL; net content 500 mL")
    artwork["pages"][0]["spans"][0]["text"] = "Net content 250 mL"
    assert evaluate_run(artwork, refs, run)["checks"][0]["result"] == "needs_review"


def test_draft_reference_stays_linked_to_review_question():
    artwork, refs, run = fixture("Net content 250 mL", approved="draft")
    check = evaluate_run(artwork, refs, run)["checks"][0]
    assert check["result"] == "needs_review"
    assert check["observed"] == "250 mL" and check["expected"] == "250 mL"
    assert check["evidence"]["sourceId"] == "r"
