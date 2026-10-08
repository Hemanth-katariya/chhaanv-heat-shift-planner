"""Crew briefing: fixed-wording script from the plan, optionally reworded by a Strands agent and voiced by Polly."""

import base64
import json
import os
import re

DEFAULT_MODEL = "apac.amazon.nova-lite-v1:0"

SYSTEM_PROMPT = """You write short spoken heat-safety briefings that a construction site supervisor in India plays to the crew every morning.
Rules:
- Use only the facts in the JSON you are given. Never change, add or drop a time, a duration or a quantity.
- Write every number as digits.
- Plain everyday spoken language a daily-wage worker understands. No headings, lists, markdown or emojis.
- 60 to 90 words. Start with a greeting, end with a reminder to report dizziness, headache or nausea to the supervisor at once.
- Output only the script."""


def _hi_time(hour):
    period = "सुबह" if hour < 12 else "दोपहर" if hour < 16 else "शाम" if hour < 20 else "रात"
    return f"{period} {hour if hour <= 12 else hour - 12} बजे"


def _en_time(hour):
    return f"{hour if hour <= 12 else hour - 12} {'am' if hour < 12 else 'pm'}"


def _num(x):
    return str(int(x)) if float(x).is_integer() else str(x)


def facts(plan, site, when, lang):
    t = _hi_time if lang == "hi" else _en_time
    return {
        "site": site,
        "day": when,
        "work_blocks": [{"from": t(b["start"]), "to": t(b["end"])} for b in plan["planned"]["blocks"]],
        "shift_changed_from_usual": plan["changed"],
        "no_work_in_sun": {"from": t(plan["stop"]["start"]), "to": t(plan["stop"]["end"])} if plan["stop"] else None,
        "hottest_time": t(plan["peak"]["hour"]),
        "hottest_temperature_c": round(plan["peak"]["temp"]),
        "rest_minutes_per_hour": plan["rest_min"],
        "water_litres_per_worker": _num(plan["water_l_per_worker"]),
        "water_rule": "one glass every 20 minutes, even if not thirsty",
    }


def template_script(f, lang):
    blocks, stop, rest = f["work_blocks"], f["no_work_in_sun"], f["rest_minutes_per_hour"]
    if lang == "hi":
        day = "आज" if f["day"] == "today" else "कल"
        s = [f"नमस्ते साथियो। {f['site']} के लिए {day} की गर्मी की जानकारी।"]
        s.append(f"{day} {f['hottest_time']} के आसपास सबसे ज़्यादा गर्मी रहेगी, तापमान लगभग {f['hottest_temperature_c']} डिग्री।")
        if not blocks:
            s.append(f"{day} धूप में कोई भी काम सुरक्षित नहीं है। काम बंद रहेगा।")
        else:
            if f["shift_changed_from_usual"]:
                s.append(f"इसलिए {day} काम का समय बदला गया है।")
            s.append("काम " + ", फिर ".join(f"{b['from']} से {b['to']} तक" for b in blocks) + " चलेगा।")
            if stop:
                s.append(f"{stop['from']} से {stop['to']} के बीच धूप में काम बंद रहेगा।")
            if len(rest) > 1:
                s.append(f"हर घंटे कम से कम {rest[0]} मिनट, और गर्मी बढ़ने पर {rest[-1]} मिनट छाँव में आराम करें।")
            else:
                s.append(f"हर घंटे {rest[0]} मिनट छाँव में आराम करें।")
            s.append("हर 20 मिनट में एक गिलास पानी पिएँ, प्यास न लगे तब भी।")
            s.append(f"हर साथी के लिए {f['water_litres_per_worker']} लीटर पानी रखा गया है।")
        s.append("चक्कर आए, सिर दर्द हो या उल्टी जैसा लगे, तो तुरंत काम रोकें और सुपरवाइज़र को बताएँ। सुरक्षित रहें।")
        return " ".join(s)

    day = "today" if f["day"] == "today" else "tomorrow"
    s = [f"Good morning everyone. This is the heat plan for {f['site']} {day}."]
    s.append(f"The hottest time will be around {f['hottest_time']}, about {f['hottest_temperature_c']} degrees.")
    if not blocks:
        s.append("No outdoor work is safe in this heat. Work is stopped.")
    else:
        if f["shift_changed_from_usual"]:
            s.append("So the shift timing has changed.")
        s.append("We work " + ", then ".join(f"from {b['from']} to {b['to']}" for b in blocks) + ".")
        if stop:
            s.append(f"No work in the sun between {stop['from']} and {stop['to']}.")
        if len(rest) > 1:
            s.append(f"Rest in the shade at least {rest[0]} minutes every hour, and {rest[-1]} minutes when it gets hotter.")
        else:
            s.append(f"Rest in the shade {rest[0]} minutes every hour.")
        s.append("Drink one glass of water every 20 minutes, even if you are not thirsty.")
        s.append(f"There are {f['water_litres_per_worker']} litres of water for each worker.")
    s.append("If you feel dizzy, get a headache or feel like vomiting, stop work and tell the supervisor at once. Stay safe.")
    return " ".join(s)


def _required_numbers(f):
    """Every figure the script must still contain after the agent rewords it."""
    nums = {str(f["hottest_temperature_c"])}
    spans = list(f["work_blocks"]) + ([f["no_work_in_sun"]] if f["no_work_in_sun"] else [])
    for span in spans:
        nums.update(re.findall(r"\d+", span["from"] + " " + span["to"]))
    if f["work_blocks"]:
        nums.update(str(r) for r in f["rest_minutes_per_hour"])
        nums.add(f["water_litres_per_worker"])
    return nums


def agent_script(f, lang):
    """Reword the briefing with a Strands agent; return None if it is unavailable or alters a number."""
    try:
        from strands import Agent
        from strands.models import BedrockModel

        agent = Agent(
            model=BedrockModel(model_id=os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL)),
            system_prompt=SYSTEM_PROMPT,
            callback_handler=None,
        )
        language = "Hindi (Devanagari script)" if lang == "hi" else "simple Indian English"
        text = str(agent(f"Language: {language}\nFacts:\n{json.dumps(f, ensure_ascii=False)}")).strip()
    except Exception as exc:
        print(f"agent unavailable: {exc!r}")
        return None
    found = set(re.findall(r"\d+(?:\.\d+)?", text))
    if not _required_numbers(f) <= found:
        print("agent script dropped a required number; using template")
        return None
    return text


def polly_mp3_b64(text, lang):
    try:
        import boto3

        out = boto3.client("polly").synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId="Kajal",
            Engine="neural",
            LanguageCode="hi-IN" if lang == "hi" else "en-IN",
        )
        return base64.b64encode(out["AudioStream"].read()).decode()
    except Exception as exc:
        print(f"polly unavailable: {exc!r}")
        return None


def build(plan, site, when, lang, use_agent=None, use_polly=None):
    use_agent = os.environ.get("USE_AGENT") == "1" if use_agent is None else use_agent
    use_polly = os.environ.get("USE_POLLY") == "1" if use_polly is None else use_polly
    f = facts(plan, site, when, lang)
    script = agent_script(f, lang) if use_agent else None
    source = "agent" if script else "template"
    script = script or template_script(f, lang)
    return {
        "script": script,
        "source": source,
        "audio_b64": polly_mp3_b64(script, lang) if use_polly else None,
    }
