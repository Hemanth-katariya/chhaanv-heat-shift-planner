# Chhaanv (छाँव) - Environmental Hacks submission, Track 02: Heat and Water

## The problem

India lost about 181 billion potential labour hours to heat in 2023. Government advisories already tell employers to move outdoor work away from midday, but the advice is general. A site supervisor still has to decide, each morning, when the crew starts, when it stops and how much rest and water it needs.

## What Chhaanv does

One user, one decision. A supervisor enters the site location and how heavy the work is. Chhaanv returns:

- an hour-by-hour plan for today and tomorrow, each hour marked safe, caution or stop;
- a rearranged shift (for example 05:00-10:00, then 18:00-20:00) next to the usual 09:00-17:00;
- rest minutes per hour and litres of water per worker and for the crew;
- a Hindi voice briefing to play to the crew, and a WhatsApp message to share.

The app works in English and Hindi, on a phone. October is mild, so the demo uses a replay of the 19 May 2026 heatwave (44 °C in Delhi and Nagpur) from recorded weather.

## How it works

The safety numbers are plain code, not AI. Open-Meteo weather feeds a WBGT estimate (Ono and Tonouchi 2014), which is compared with ACGIH work/rest limits, with every hour judged 1 °C stricter. The planner picks up to two work blocks of eight hours in total that avoid every stop hour. The AI agent only words the spoken briefing, and its output is rejected if any time or quantity from the plan is missing.

AWS services: Lambda and API Gateway (SAM), DynamoDB for saved sites, EventBridge Scheduler for a 5 am daily plan, Amazon Polly (Kajal, neural) for Hindi audio, S3 for the web app, and the Strands Agents SDK on Amazon Bedrock for briefing wording.

## What we checked, and what we did not

- The ACGIH limits match the table reproduced by CCOHS. The table has no value for heavy work at 75-100 %, so 26.0 °C there is our own cautious figure.
- We could not open the original WBGT paper. We compared the formula with WBGT computed from wet-bulb temperature for 25-44 °C and 15-90 % humidity: it agrees within 1.2 °C and never reads more than 0.7 °C low. The 1 °C margin covers that.
- WBGT is estimated from forecasts, not measured with a globe thermometer. The app says so under every plan.
- Bedrock was not available on our new AWS account during the hackathon (every call returned "Operation not allowed"). The briefing therefore uses the fixed-wording fallback in the deployed app.

## AI tools used

- Claude Code (Anthropic) wrote and tested most of the code.
- Strands Agents SDK with Amazon Bedrock, for briefing wording at run time (see the Bedrock note above).
- Amazon Polly for the Hindi voice.

## Links

- Repo: https://github.com/Hemanth-katariya/chhaanv-heat-shift-planner
- Live app: https://er15mg1dc8.execute-api.ap-south-1.amazonaws.com
- Video: https://youtu.be/UirmULCPkWk
- Blog: https://builder.aws.com/content/3KT0I9ErCfuwp9AIaeSPAgfS40m/chhaanv-turning-avoid-the-midday-sun-into-a-heat-safe-shift-schedule
