"""One-shot parser sandbox: no credentials intentionally needed by extraction/rules."""

import json
import sys
from pathlib import Path

if sys.platform != "win32":
    import resource


def main():
    if sys.platform != "win32":
        resource.setrlimit(resource.RLIMIT_CPU, (90, 95))
    # macOS RLIMIT_AS is unsupported; Linux deployments enforce the address-space cap.
    if sys.platform not in ("darwin", "win32"):
        resource.setrlimit(resource.RLIMIT_AS, (1536 * 1024**2, 1536 * 1024**2))
    payload = json.load(sys.stdin)
    operation = sys.argv[1]
    if operation == "extract":
        from app.extraction.documents import extract_document
        from app.extraction.references import extract_reference

        artwork = payload["artwork"]
        result = {
            "artwork": dict(
                id=artwork["id"],
                **extract_document(Path(artwork["path"]), artwork["fileType"]),
            ),
            "references": [],
        }
        for ref in payload["references"]:
            result["references"].append(
                {k: v for k, v in ref.items() if k not in ("path", "fileType")}
                | {"extraction": extract_reference(Path(ref["path"]), ref["fileType"])}
            )
    elif operation == "validate":
        from app.storage import validate

        file_type, pages = validate(Path(payload["path"]).read_bytes(), payload["kind"])
        result = {"fileType": file_type, "pages": pages}
    elif operation == "explain":
        from app.verification.ai import explain_report

        result = explain_report(payload)
    elif operation == "evaluate":
        from app.verification.rules import evaluate_run

        result = evaluate_run(payload["artwork"], payload["references"], payload["run"])
    else:
        raise ValueError("Unsupported processing operation")
    print(json.dumps({"ok": True, "result": result}))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)[:1000]}))
        sys.exit(1)
