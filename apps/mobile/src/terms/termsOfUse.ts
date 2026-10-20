import { CalendarDate } from '../domain/CalendarDate';
import type { Platform } from '../domain/integration/Platform';
import { healthPlatformName } from '../format/healthPlatformName';
import type { TermsSection } from './TermsSection';

/**
 * The terms of use (MM-242), as shipped with the app: there is no server to
 * fetch them from, so they change only with an update.
 *
 * DRAFT. Written from the expert panel's guidance on language for health
 * apps (docs/agent-runs/mm242-eula). Nobody on that panel is a lawyer, and
 * no lawyer or clinician has reviewed this text. It must not ship in a
 * release until one has; the ticket lists what is still to be decided
 * (who grants the licence, which state's law, disputes, a contact address).
 *
 * Every statement about what the app does is one the code supports today.
 * Change the app and this text together, and raise `version` whenever a
 * change matters to the person, so the app asks them again.
 */
/**
 * The full terms for the platform the app is on (MM-403): the health platform
 * and the camera's reader are named for what they are there. Every statement
 * holds on that platform; nothing else differs.
 */
function sectionsOn(platform: Platform): readonly TermsSection[] {
  const ios = platform === 'ios';
  const health = healthPlatformName(platform);
  return [
    {
      heading: '1. This agreement',
      paragraphs: [
        'These terms are an agreement between you and the developer of Martian Macros ("we"). By choosing "I agree" you accept them. If you do not agree, do not use the app.',
        'The points under "Before you start" are a short account of what matters most. These full terms are what applies, and they cover more than that short account does.',
      ],
    },
    {
      heading: '2. Who the app is for',
      paragraphs: [
        'The app is for people aged 18 or over in the United States. By continuing you confirm you are at least 18. We rely on the date of birth you enter. Growing bodies need different guidance than this app provides.',
      ],
    },
    {
      heading: '3. Not medical advice',
      paragraphs: [
        'Martian Macros is a general wellness app. It is not a medical device. It does not diagnose, treat, cure or prevent any disease or condition, and nothing in it is medical advice.',
        'Using the app does not make anyone your doctor, dietitian or coach. No health professional reviews your information or your numbers. The app is software that does arithmetic on what you enter.',
        'If a health professional’s advice differs from the app, follow the professional.',
      ],
    },
    {
      heading: '4. When to talk to a clinician first',
      paragraphs: [
        'Talk to a doctor or registered dietitian before you use the app’s targets if you: are pregnant or breastfeeding; have or have had an eating disorder; have kidney disease; have diabetes, especially if you use insulin or a sulfonylurea; have a thyroid condition or PCOS; are in perimenopause or menopause; have had weight-loss surgery; take testosterone, anabolic steroids, or any medicine that changes your weight or appetite; have a diagnosed sleep disorder such as sleep apnea; are underweight; are 65 or older; or are under a doctor’s care for any other condition.',
        'The app asks about some of these and limits what it will suggest. Those limits are not medical clearance, and the questions do not cover everything.',
      ],
    },
    {
      heading: '5. Estimates, not promises',
      paragraphs: [
        'Every number is an estimate: calories, macros, energy use, body fat, trend weight. Estimates can be wrong, sometimes by a lot, and food data can contain errors.',
        'The app’s limits are our judgement. They have not been approved by a regulator or reviewed by a health professional.',
        'We do not promise that you will lose fat, gain muscle or reach any weight in any time.',
      ],
    },
    {
      heading: '6. Emergencies',
      paragraphs: [
        'The app cannot help in an emergency. If you think you may have a medical emergency, call 911.',
        'Stop following the app’s targets and get medical help if you feel faint, dizzy or unwell.',
      ],
    },
    {
      heading: '7. If tracking stops helping',
      paragraphs: [
        'Tracking food and weight is not right for everyone. If it makes you anxious, leads you to eat much less than the app suggests, or starts to take over, stop using it and talk to a doctor, a registered dietitian or a mental-health professional. The app’s targets are not there to be eaten below.',
      ],
    },
    {
      heading: '8. Your decisions',
      paragraphs: [
        'You decide what to eat and how to train, and those choices are yours. The app works from what you tell it: answer the health questions truthfully, and update them when your health changes.',
      ],
    },
    {
      heading: '9. Your records',
      paragraphs: [
        `Everything you enter (your profile, date of birth, health answers, weigh-ins, measurements, nights of sleep, food log, workouts and check-ins) and anything you let the app read from ${health} is kept in a database inside this app on this phone.`,
        'There is no account. We run no server that receives your records, so we cannot see, recover, correct or delete them for you. The app does not send your records anywhere.',
        'If you choose to download the food database, your phone contacts GitHub to fetch a file. GitHub sees your IP address, which file was requested, when, and basic technical details your phone sends with any download. Nothing about you or your records is sent, and nothing is downloaded unless you ask for it.',
        'If you allow it, the app can look a food up online when the food database on this phone does not have it: it sends the barcode number you scanned or typed, or the words you searched for, to Open Food Facts and, where the app offers it, to USDA FoodData Central. Those services see your IP address and what was asked. Nothing about you or your records is sent. The app asks before the first lookup, and you can choose always, just for now (until you close the app) or never, and change that in Settings, under Data. A food found this way is kept on this phone.',
        `${health} is optional. If you allow it, the app reads only the kinds of data you allow, and never writes to ${health}. What it reads is copied into the app on this phone and stays there until you erase it, even if you later take the permission away.`,
        ios
          ? 'The camera is used only when you scan a barcode or photograph a nutrition label. Both are read on the phone by software that is part of iOS, and the label photo is not kept.'
          : 'The camera is used only when you scan a barcode or photograph a nutrition label. Both are read on the phone, and a label photo is deleted as soon as it has been read. The barcode and label reader is a Google component (ML Kit). Google says that component sends Google technical details about itself, such as the phone’s model, the app’s version, and performance and error codes. It is not given your records.',
        'Reminders you turn on are scheduled by the phone itself. No message service is involved.',
      ],
    },
    {
      heading: '10. Keeping your records',
      paragraphs: [
        'The app makes no copy of your records anywhere else. If you lose, break, reset or replace the phone, uninstall the app, or erase its data, your records are gone and we cannot restore them. We do not promise that your records will be preserved.',
        'Your records are as private as your phone. The app does not add a password or a lock of its own, so anyone who can unlock your phone can open the app. Keep a screen lock on and keep the phone up to date.',
        'Settings, then "Erase all data and start over", deletes every record in the app and returns it to first use. Uninstalling the app removes them too. Erasing does not remove a food database you downloaded and does not change permissions you granted; you can withdraw those in the phone’s settings.',
      ],
    },
    {
      heading: '11. Food data and other people’s software',
      paragraphs: [
        'Food data comes from Open Food Facts, under the Open Database License, and from USDA FoodData Central. It is gathered by volunteers and public bodies and may be wrong. It is offered to you under its own licences, which these terms do not change.',
        ios
          ? 'The app contains open-source software, each part under its own licence or terms. Those apply to those parts.'
          : 'The app contains open-source software and Google’s ML Kit, each under its own licence or terms. Those apply to those parts.',
      ],
    },
    {
      heading: '12. Your licence to use the app',
      paragraphs: [
        'While you follow these terms, you may install and use the app on phones you own or control, for your own personal use. Everything else about the app stays with us.',
      ],
    },
    {
      heading: '13. No warranty',
      paragraphs: [
        'The app is provided as it is. As far as the law allows, we make no warranties about it, including that it is accurate, free of errors, fit for a particular purpose, or always available.',
      ],
    },
    {
      heading: '14. Limits on what we are responsible for',
      paragraphs: [
        'As far as the law allows, we are not responsible for losses that come from using the app or relying on its numbers, including lost records. Some laws do not allow some of these limits, so parts of this section and the one before it may not apply to you.',
      ],
    },
    {
      heading: '15. Changes to these terms',
      paragraphs: [
        'These terms come with the app, so they can change only when the app is updated. If they change in a way that matters, the app shows them again, says what changed, and asks you to agree before you continue. Your records stay on the phone while you decide.',
      ],
    },
    {
      heading: '16. Stopping',
      paragraphs: [
        'You can stop using the app at any time by uninstalling it. Section 10 says how to erase your records first.',
      ],
    },
  ];
}

export const termsOfUse = {
  /** Raised when the terms change in a way that matters. The app asks again when this differs from what was agreed to. */
  version: 2,

  effectiveOn: CalendarDate.of(2026, 10, 20),

  /** What changed in each version after the first, in a sentence or two each, for someone who agreed to an earlier one. */
  changes: new Map<number, readonly string[]>([
    [
      2,
      [
        'The app can now look a food up online when the food database on this phone does not have it, but only if you allow it. It then sends the barcode number or the words you searched for to Open Food Facts (and, where the app offers it, to USDA FoodData Central), and nothing about you. Section 9 says more.',
      ],
    ],
  ]),

  /** The few things that matter most, said first and plainly. The full terms say more. */
  summary: [
    'Martian Macros is a general wellness app, not a medical device. It is not medical advice, and it does not diagnose or treat anything.',
    'Its numbers are estimates worked out from what you log, and they can be off.',
    'If you are pregnant or breastfeeding, have a medical condition, take medicine that affects your weight or blood sugar, or have a history of an eating disorder, talk to your clinician before changing how you eat.',
    'The app cannot help in an emergency. If you think you may have a medical emergency, call 911.',
    'You stay in charge: the app recommends and explains, and what you eat and how you train is your decision.',
    'The app is for adults 18 and over.',
  ],

  /** The sections for the platform the app is on. */
  sectionsOn,

  /** The sections as on an Android phone, which is how a browser draws the app. */
  sections: sectionsOn('android'),
} as const;
