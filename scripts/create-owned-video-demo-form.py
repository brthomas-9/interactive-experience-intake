#!/usr/bin/env python3
"""
Create an owned copy of the Video Demo Google Form via `gws forms`.

Prereq:
  1. Enable Forms API:
     https://console.developers.google.com/apis/api/forms.googleapis.com/overview?project=brthomas-ai
  2. gws auth with Drive scope (already present for brthomas@redhat.com)

Usage:
  python3 scripts/create-owned-video-demo-form.py
"""
from __future__ import annotations

import json
import subprocess
import sys
import time


ORIGINAL_DESCRIPTION = (
    "OWNED WORKING COPY for Interactive Experience intake routing "
    "(Arcade AI videos, Drive / RH TV / MP4, and other hosts the AI intake cannot fully populate).\n\n"
    "For Arcade Interactive demos and YouTube videos, use the AI Submission / intake form instead.\n\n"
    "By submitting, you confirm:\n"
    "- The content is complete, meets all requirements, and is ready for review with all interactive elements tested.\n"
    "- Public listing on the Architecture Center or Interactive Experience landing page is not guaranteed.\n"
    "- If intended for public listing, the submission is unique to those platforms.\n\n"
    "What happens next? Submissions are reviewed weekly. If approved, a production version will be created "
    "and added to the Repository dashboard which you can also find in The Source.\n\n"
    "We look for quality, completeness, and relevance to what’s top of mind right now.\n\n"
    "If you have any questions, please reach out to interactive-experiences@redhat.com."
)

TEAMS = [
    "CFE",
    "Portfolio Technical Marketing and Platforms",
    "App Services",
    "Ansible BU",
    "AI BU",
    "HCE",
    "HPBU",
    "RHEL BU",
]
QUARTERS = ["CY25Q3", "CY25Q4", "CY26Q1", "CY26Q2", "CY26Q3", "CY26Q4"]
LANGUAGES = ["English", "Spanish", "Portuguese", "German", "French", "Korean", "Chinese"]
PRODUCTS = [
    "Red Hat Ansible Automation Platform",
    "Red Hat Enterprise Linux",
    "Red Hat OpenShift",
    "Red Hat Insights",
    "Red Hat OpenShift Virtualization",
    "Red Hat OpenStack",
    "Red Hat Satellite",
]
TDPS = [
    "Server/Cloud Operating System",
    "Virtualization",
    "Container Management",
    "Application Platform",
    "Mission Critical IT Automation",
    "AI Platform",
]
SALES = [
    "Server/Cloud Operating System - Seamlessly adopt a standardized operating environment",
    "Server/Cloud Operating System - Optimize and secure my operating system",
    "Server/Cloud Operating System - Innovate fast across the hybrid cloud with RHEL",
    "Server/Cloud Operating System - Maximize portability in the Cloud",
    "Virtualization - VM Migration - Targets VMware/ Broadcom customers (on-prem & cloud).",
    "Virtualization - VM Modernization - Targets customers who want a more modern way to virtualize next to legacy virtualiza",
    "Container Management - Kubernetes for non-AI 3rd party  workloads (e.g. Confluent, SQL Server, SAP, CloudPaks, etc)",
    "Container Management - Kubernetes for AI 3rd party  workloads (e.g. H2O.ai, Cloudera, Run.ai, C3 AI, etc)",
    "Container Management - Multicluster  management and security at scale for Kubernetes.",
    "Application Platform - Modernize legacy apps & develop net-new cloud-native apps",
    "Application Platform - Streamline application connectivity for the hybrid cloud",
    "Application Platform - Secure the software supply chain and platform operation",
    "Application Platform - Increase developer productivity for apps and hybrid cloud",
    "Mission Critical Automation - Enterprise-wide automation (expanding AAP in the enterprise)",
    "Mission Critical Automation - Standardize on AAP (converting free to enterprise)",
    "Mission Critical Automation - Maximize technology investments  (AAP + AI/RHEL/Virt/ISV)",
    "Mission Critical Automation - Network automation",
    "AI Platform - Private AI",
    "AI Platform - Operationalize AI",
    "AI Platform - Multi-architecture AI Deployment",
    "N/A",
]
MARKETING = [
    "RHEL Campaign - Build & Deploy on RHEL",
    "RHEL Campaign - Standardize on RHEL",
    "Virtualization Campaign - VM Migration",
    "App Platform Campaign - App Modernization",
    "App Platform Campaign - Platform Engineering",
    "Automation Campaign - Automation Acceleration",
    "Automation Campaign - Getting Started with AAP",
    "Adopt & Scale AI Campaign - Operationalize AI with RHOAI",
    "Adopt & Scale AI Campaign - Getting Started with Gen AI with RHEL AI",
    "N/A",
]
VERTICALS = [
    "No, it is applicable to multiple verticals",
    "Financial Service",
    "Healthcare",
    "Manufacturing",
    "Retail",
    "Telco & Media",
    "Utility",
]
EVENTS = ["No", "Red Hat One", "KubeCon", "Summit"]
BRAND = (
    "I have read the list of requirements and ensured this asset meets brand standards "
    "and includes English and Spanish translations for accessibility."
)


def gws_json(args: list[str], body: dict | None = None) -> dict:
    cmd = ["gws", *args]
    if body is not None:
        cleaned = {k: v for k, v in body.items() if v is not None}
        cmd.extend(["--json", json.dumps(cleaned)])
    proc = subprocess.run(cmd, capture_output=True, text=True)
    out = (proc.stdout or "").strip()
    lines = [ln for ln in out.splitlines() if not ln.startswith("Using keyring")]
    payload = "\n".join(lines).strip()
    if proc.returncode != 0:
        raise RuntimeError(((proc.stderr or "") + "\n" + payload).strip() or f"gws failed: {args}")
    start = payload.find("{")
    if start < 0:
        raise RuntimeError(f"No JSON in gws output for {args}: {payload[:800]}")
    data = json.loads(payload[start:])
    if isinstance(data, dict) and "error" in data:
        raise RuntimeError(json.dumps(data["error"], indent=2))
    return data


def short(title: str, required: bool = True) -> dict:
    return {
        "title": title,
        "questionItem": {
            "question": {"required": required, "textQuestion": {"paragraph": False}}
        },
    }


def paragraph(title: str, required: bool = True) -> dict:
    return {
        "title": title,
        "questionItem": {
            "question": {"required": required, "textQuestion": {"paragraph": True}}
        },
    }


def choice(title: str, options: list[str], qtype: str, required: bool = True) -> dict:
    return {
        "title": title,
        "questionItem": {
            "question": {
                "required": required,
                "choiceQuestion": {
                    "type": qtype,
                    "options": [{"value": o} for o in options if o != ""],
                },
            }
        },
    }


def page_break(title: str, description: str | None = None) -> dict:
    item: dict = {"title": title.strip(), "pageBreakItem": {}}
    if description:
        item["description"] = description
    return item


def build_items() -> list[dict]:
    items: list[dict] = []
    items.append(
        choice(
            "Which submission type best describes your demo?",
            [
                "I am submitting a stand-alone demo (No Global ID)",
                "I am submitting a demo linked to an existing Request (I have a Global ID)",
            ],
            "RADIO",
        )
    )
    items.append(page_break("Link to an Existing Request"))
    items.append(short("Global ID"))
    items.append(short("Creator Name(s)"))
    items.append(choice("Creator Team(s)", TEAMS, "DROP_DOWN"))
    items.append(short("Video Link"))
    items.append(short("Final Demo Title"))
    items.append(choice("What quarter was this content created in?", QUARTERS, "DROP_DOWN"))
    items.append(paragraph("Description (50-150 words)"))
    items.append(short("Keywords for SEO"))
    items.append(choice("Language", LANGUAGES, "CHECKBOX"))
    items.append(paragraph("Links for next step call to action"))
    items.append(choice("Synthetic Voice Used?", ["Yes", "No"], "RADIO"))
    items.append(choice("Translation Used?", ["Yes", "No"], "RADIO"))
    items.append(choice("Mobile-friendly design considered?", ["Yes", "No"], "RADIO"))
    items.append(short("Optional: Have an Employee Advocacy link? Add it here.", required=False))
    items.append(
        paragraph(
            "Optional: Should this IE be grouped with another or part of a larger collection? If yes, add the name of the IE it belongs with.",
            required=False,
        )
    )
    items.append(choice(BRAND, ["Agree"], "RADIO"))

    items.append(page_break("Create a New Stand-Alone Submission"))
    items.append(choice("Content Type", ["Business Intro", "Technical Walkthrough"], "RADIO"))
    items.append(short("Creator Name(s)"))
    items.append(choice("Creator Team(s)", TEAMS, "DROP_DOWN"))
    items.append(short("Creation Link"))
    items.append(short("Final Demo Title"))
    items.append(
        paragraph(
            "Optional: Should this IE be grouped with another or part of a larger collection? If yes, add the name of the IE it belongs with.",
            required=False,
        )
    )
    items.append(choice("What quarter was this content created in?", QUARTERS, "DROP_DOWN"))
    items.append(paragraph("Demo Description (50-150 words)"))
    items.append(choice("Language", LANGUAGES, "CHECKBOX"))
    items.append(paragraph("Links for next step call to action"))
    items.append(short("Keywords for SEO"))
    items.append(choice("Vertical", VERTICALS, "CHECKBOX"))
    items.append(choice("Is this for a specific event or project?", EVENTS, "DROP_DOWN"))
    items.append(choice("Primary product featured?", PRODUCTS, "DROP_DOWN"))
    items.append(choice("Optional: Other related products?", PRODUCTS, "DROP_DOWN", required=False))
    items.append(choice("Related Technology Decision Point?", TDPS, "DROP_DOWN"))
    items.append(choice("Related Sales Tactic?", SALES, "DROP_DOWN"))
    items.append(choice("Related Marketing Program?", MARKETING, "DROP_DOWN"))
    items.append(choice("Synthetic Voice Used?", ["Yes", "No"], "RADIO"))
    items.append(choice("Translation Used?", ["Yes", "No"], "RADIO"))
    items.append(choice("Mobile-friendly design considered?", ["Yes", "No"], "RADIO"))
    items.append(short("Optional: Have an Employee Advocacy link? Add it here.", required=False))
    items.append(choice(BRAND, ["Agree"], "RADIO"))
    return items


def main() -> int:
    print("Creating form…", flush=True)
    created = gws_json(
        ["forms", "forms", "create"],
        {
            "info": {
                "title": "Video Demo Submission (IE Intake Copy)",
                "documentTitle": "Video Demo Submission - IE Intake Owned Copy",
            }
        },
    )
    form_id = created["formId"]
    revision = created.get("revisionId")
    print(f"Created formId={form_id}", flush=True)

    updated = gws_json(
        ["forms", "forms", "batchUpdate", "--params", json.dumps({"formId": form_id})],
        {
            "includeFormInResponse": True,
            "writeControl": {"targetRevisionId": revision} if revision else None,
            "requests": [
                {
                    "updateFormInfo": {
                        "info": {"description": ORIGINAL_DESCRIPTION},
                        "updateMask": "description",
                    }
                }
            ],
        },
    )
    form = updated.get("form") or created
    revision = (updated.get("writeControl") or {}).get("targetRevisionId") or form.get("revisionId")

    items = build_items()
    chunk_size = 15
    for start in range(0, len(items), chunk_size):
        chunk = items[start : start + chunk_size]
        remapped = [
            {"createItem": {"item": item, "location": {"index": start + i}}}
            for i, item in enumerate(chunk)
        ]
        updated = gws_json(
            ["forms", "forms", "batchUpdate", "--params", json.dumps({"formId": form_id})],
            {
                "includeFormInResponse": True,
                "writeControl": {"targetRevisionId": revision} if revision else None,
                "requests": remapped,
            },
        )
        form = updated.get("form") or form
        revision = (updated.get("writeControl") or {}).get("targetRevisionId") or form.get(
            "revisionId"
        )
        print(f"Added items {start}..{start + len(chunk) - 1}", flush=True)
        time.sleep(0.25)

    form = gws_json(["forms", "forms", "get", "--params", json.dumps({"formId": form_id})])
    revision = form.get("revisionId")
    form_items = form.get("items") or []

    page_ids = [it["itemId"] for it in form_items if it.get("pageBreakItem") is not None]
    first_question_id = None
    first_question_index = None
    for idx, it in enumerate(form_items):
        if it.get("questionItem"):
            first_question_id = it["itemId"]
            first_question_index = idx
            break

    if first_question_id and len(page_ids) >= 2:
        gid_id, stand_alone_id = page_ids[0], page_ids[1]
        gws_json(
            ["forms", "forms", "batchUpdate", "--params", json.dumps({"formId": form_id})],
            {
                "includeFormInResponse": True,
                "writeControl": {"targetRevisionId": revision} if revision else None,
                "requests": [
                    {
                        "updateItem": {
                            "item": {
                                "itemId": first_question_id,
                                "title": "Which submission type best describes your demo?",
                                "questionItem": {
                                    "question": {
                                        "required": True,
                                        "choiceQuestion": {
                                            "type": "RADIO",
                                            "options": [
                                                {
                                                    "value": "I am submitting a stand-alone demo (No Global ID)",
                                                    "goToSectionId": stand_alone_id,
                                                },
                                                {
                                                    "value": "I am submitting a demo linked to an existing Request (I have a Global ID)",
                                                    "goToSectionId": gid_id,
                                                },
                                            ],
                                        },
                                    }
                                },
                            },
                            "location": {"index": first_question_index},
                            "updateMask": "title,questionItem",
                        }
                    }
                ],
            },
        )
        print("Wired section routing on submission-type question.", flush=True)

    form = gws_json(["forms", "forms", "get", "--params", json.dumps({"formId": form_id})])
    print("\n=== FORM READY ===")
    print(f"formId:        {form_id}")
    print(f"edit URL:      https://docs.google.com/forms/d/{form_id}/edit")
    print(f"responder URL: {form.get('responderUri')}")
    print(f"item count:    {len(form.get('items') or [])}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print("FAILED:", e, file=sys.stderr)
        raise SystemExit(1)
