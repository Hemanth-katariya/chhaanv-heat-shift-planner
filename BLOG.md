# Chhaanv: turning "avoid the midday sun" into a schedule for a construction crew

*Built for Environmental Hacks, Track 02: Heat and Water.*

India lost about 181 billion potential work hours to heat in 2023. Government heat advisories already tell employers to keep outdoor work away from midday. But a site supervisor still has to answer a concrete question every morning: when does my crew work today, how much do they rest, and how much water do I need on site?

Chhaanv (छाँव, "shade") answers that for one supervisor and one site. You enter a location and how heavy the work is. It returns an hour-by-hour plan for today and tomorrow, each hour marked safe, caution or stop. It then rearranges the shift around the stop hours, sets rest minutes and litres of water, and produces a Hindi voice briefing and a WhatsApp message for the crew.

For a moderate-work crew in Delhi on 19 May 2026 (44 °C), the usual 9-to-5 shift has zero safe working time and eight unsafe hours. Chhaanv moves it to 05:00-09:00.

Demo video: https://youtu.be/UirmULCPkWk
Code: https://github.com/Hemanth-katariya/chhaanv-heat-shift-planner

## The stack

| Part | Service |
| --- | --- |
| API | AWS Lambda behind API Gateway, defined in one AWS SAM template |
| Saved sites | DynamoDB |
| 5 am daily plan | EventBridge Scheduler |
| Hindi voice | Amazon Polly (Kajal, neural) |
| Web app | S3, served through the same API Gateway address |
| Briefing wording | Strands Agents SDK on Amazon Bedrock (integrated, see below) |

Weather comes from Open-Meteo, which is free and needs no key, so there is no hardware and nothing to train.

One design choice I would repeat: **the safety numbers are plain code, not an LLM.** Heat stress is estimated as WBGT from temperature, humidity, wind and solar radiation, then compared with ACGIH work/rest limits. A planner picks up to two work blocks of eight hours in total that avoid every stop hour. The agent is only allowed to word the spoken briefing, and its output is rejected if any time or quantity from the plan is missing. A number someone might act on should be one you can defend.

## What fought back

**Bedrock never worked on my new account.** Every Converse call failed with "ValidationException: Operation not allowed", in two regions and across the Nova models I tried. It looked like new-account verification, not my code. The Strands agent is integrated, but it has never run successfully, so the deployed app uses fixed briefing wording. The fallback is why this was survivable: the planner never depended on the model, and the app says plainly when it is using standard wording.

**CloudFront was also blocked** on the unverified account. I made it a template parameter (`UseCloudFront`, off by default) and had Lambda serve the web app from S3 through API Gateway instead.

**I could not read the WBGT paper.** The formula I used (Ono and Tonouchi, 2014) came from memory, and the original PDFs would not open. Rather than trust my recall, I compared the formula's shade values with WBGT computed from wet-bulb temperature for 25-44 °C and 15-90 % humidity. They agreed within 1.2 °C, and the formula never read more than 0.7 °C low. So every hour is now judged 1 °C stricter, and the app and README say the numbers are an estimate. That one change moved the Delhi result from about 280 minutes of moderate work to 180. I think that is the right trade for a tool that sends people into the heat.

**The limits table has a gap.** The ACGIH screening table I checked has no value for heavy work at 75-100 % work. I used 26.0 °C there and documented it as our own cautious figure instead of presenting it as published.

**October is not hot.** A live forecast would show all green and demonstrate nothing. So the replay of a real heatwave day, 19 May 2026, from the Open-Meteo archive is a first-class feature, not a test mode, and the app labels it as a replay.

## What I would do next

Measure on site instead of estimating (a globe thermometer reading beats a forecast), add Telegram or WhatsApp delivery that does not need a share tap (SMS to Indian numbers needs DLT registration, so I avoided it), and re-test the Strands agent once Bedrock is available.

Chhaanv is a planning aid. It does not replace first aid or a supervisor's judgement. But it turns a general warning into one schedule, which is the part the supervisor is missing.
