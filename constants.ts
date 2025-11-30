import { NewsStory } from "./types";

export const NEWS_DATA: Record<string, NewsStory[]> = {
  'Local (Zim)': [
      { id: 'L01', category: 'Local (Zim)', headline: "Speed Limiters Proposed for Buses", detail: "The Zimbabwean Parliament is currently considering a bill that would mandate the installation of tamper-proof speed limiters on all commercial passenger buses. This move comes after a recent spate of fatal road accidents attributed to reckless driving and speeding.", source: "NewsDay" },
      { id: 'L02', category: 'Local (Zim)', headline: "Form 1 Enrolment Opens at Kutama High", detail: "Form 1 enrolment open at Kutama High School. Parents are advised to bring original birth certificates and result slips for verification before the deadline next week.", source: "The Herald" }
  ],
  'Business (Zim)': [
      { id: 'B01', category: 'Business (Zim)', headline: "New ZIDA Investment Zones Created", detail: "The Zimbabwe Investment Development Agency (ZIDA) has announced the creation of three new Special Economic Zones focusing on mining beneficiation and renewable energy projects.", source: "Chronicle" },
      { id: 'B02', category: 'Business (Zim)', headline: "Inflation Rate Hits 3-Month Low", detail: "The national statistics agency reported that the year-on-year inflation rate has dropped to its lowest point in three months, primarily due to stabilized fuel prices.", source: "ZimLive" }
  ],
  'African Focus': [
      { id: 'A01', category: 'African Focus', headline: "South Africa's ANC forms GNU with rivals", detail: "The ANC has successfully formed a Government of National Unity (GNU) with its main rivals, the DA and IFP, following a consensus decision after general elections.", source: "Daily Maverick" },
  ],
  'Global': [
      { id: 'G01', category: 'Global', headline: "US Federal Reserve Holds Interest Rates Steady", detail: "The US Federal Fed announced it will hold its key interest rate target steady, citing stable inflation and robust job growth.", source: "Bloomberg" },
  ]
};

export const INITIAL_POLL_DATA = {
  id: 'current_pulse_poll',
  question: "Quick Community Poll: Do you feel the proposed speed limiters for buses will improve road safety?",
  options: {
      "Yes, enforcement will follow.": 0,
      "No, poor enforcement will negate the effect.": 0,
      "I am unsure.": 0
  },
  voters: {}, 
  totalVotes: 0,
  timestamp: Date.now()
};

export const SYSTEM_PROMPT = `You are the "Morning Pulse" AI, a helpful and concise news assistant for Zimbabwean readers. 
When answering questions:
1. Be concise (WhatsApp style).
2. If the user asks about current headlines, refer to the provided context.
3. If using Google Search, cite sources clearly at the bottom.
4. Keep the tone professional but conversational.
`;
