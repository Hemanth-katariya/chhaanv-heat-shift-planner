# Chhaanv (छाँव) - heat-safe shift planner

Built for Environmental Hacks, Track 02: Heat and Water.

A construction site supervisor enters where the site is and how heavy the work is. Chhaanv returns an hour-by-hour plan for today and tomorrow:

- **Safe and unsafe hours.** Every hour from 05:00 to 20:00 is marked safe, caution or stop.
- **A rearranged shift.** For example "05:00-10:00, then 18:00-20:00", compared with the usual 09:00-17:00 shift.
- **Rest and water.** Minutes of rest per hour and litres of water per worker and for the whole crew.
- **A Hindi voice briefing** to play to the crew before work, and a WhatsApp message to share.

The interface works in English and Hindi, on a phone.

## Why

India lost about 181 billion potential labour hours to heat in 2023, and government heat advisories already tell employers to move outdoor work away from midday. That advice is general. Chhaanv turns it into one concrete schedule for one site on one day.

## How the numbers are produced

No AI is involved in the safety numbers.

1. Hourly temperature, humidity, wind and solar radiation come from [Open-Meteo](https://open-meteo.com) (free, no key).
2. Heat stress is estimated as wet-bulb globe temperature (WBGT) with the Ono and Tonouchi (2014) formula, in [backend/heatplan/wbgt.py](backend/heatplan/wbgt.py).
3. Each hour is compared with ACGIH work/rest screening limits for light, moderate or heavy work.
4. The planner in [backend/heatplan/planner.py](backend/heatplan/planner.py) picks up to two work blocks, eight hours in total, that avoid every stop hour and give the most safe working time.

The AI agent only words the spoken briefing. Its output is rejected, and fixed wording is used instead, if any time or quantity from the plan is missing.

## Heatwave replay

October is mild, so the form has a "Replay the 19 May 2026 heatwave" option. It runs the same planner on recorded weather for that day (44 °C in Delhi and Nagpur) from the Open-Meteo archive.

## Built on AWS

| Part | Service |
| --- | --- |
| Briefing wording | Strands Agents SDK on Amazon Bedrock |
| Hindi voice | Amazon Polly (Kajal, neural) |
| API | AWS Lambda behind API Gateway, defined with AWS SAM |
| Saved sites | DynamoDB |
| 5 am daily plan | EventBridge Scheduler |
| Web app | S3, served through the same API Gateway address (CloudFront optional) |

Everything is in [template.yaml](template.yaml).

## Run it locally

Needs Python 3.12. No AWS account and no packages are required.

```
python local_server.py
```

Open http://localhost:8000. Without AWS credentials the briefing uses fixed wording and the device's own voice. To use the agent and Polly locally, install `strands-agents` and `boto3`, configure AWS credentials, and set `USE_AGENT=1` and `USE_POLLY=1`.

Run the tests:

```
python -m unittest discover -s tests
```

## Deploy

```
uv pip install --target layer/python --python-platform x86_64-manylinux2014 --python-version 3.12 --only-binary :all: -r requirements-lambda.txt
sam build
sam deploy --guided
aws s3 sync frontend/ s3://<WebBucketName output>
```

Open the `AppUrl` output. The Bedrock model set by the `BedrockModelId` parameter must be enabled in the account.

New AWS accounts cannot create CloudFront distributions until AWS has verified them, so CloudFront is off by default. Turn it on with `--parameter-overrides UseCloudFront=true`.

## Limits

- WBGT is estimated from forecast data, not measured on site with a globe thermometer.
- The limits assume workers who are used to the heat and wear normal work clothes.
- It is a planning aid. It does not replace first aid or a supervisor's judgement.

## AI tools used

- Claude Code (Anthropic) for writing and testing the code.
- Strands Agents SDK with Amazon Bedrock at run time, for the briefing wording.
