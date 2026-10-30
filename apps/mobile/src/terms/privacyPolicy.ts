import { CalendarDate } from '../domain/CalendarDate';
import type { Platform } from '../domain/integration/Platform';
import { healthPlatformName } from '../format/healthPlatformName';
import type { TermsSection } from './TermsSection';

/**
 * The privacy policy (MM-95), as shipped with the app and published word for
 * word beside the terms of use on the public page (MM-247).
 *
 * DRAFT, written with the terms (MM-242) for the same attorney. Nobody who
 * wrote it is a lawyer. The bracketed blanks (who the developer is, and how
 * to reach them) stay visible until the attorney fills them in, and it must
 * not ship in a release before that review (MM-94).
 *
 * Every request the app or a component inside it can make is named here, and
 * it never says that nothing leaves the phone: what the barcode and label
 * reader sends has not been observed (MM-244), so it repeats what Google says
 * and stays true whatever is seen. Change the app and this text together;
 * `test/terms/privacyText.test.ts` holds the addresses the code contacts to it.
 */
function summaryOn(platform: Platform): readonly string[] {
  return [
    'There is no account. We run no server that receives your records, and what you enter, progress photos included, is kept inside the app on your phone.',
    'The app uses the internet only when you ask it to download the food database or, if you allow it, to look a food up online. Neither request carries your records.',
    platform === 'ios'
      ? 'Barcodes and nutrition labels are read on the phone by software that is part of iOS.'
      : 'The barcode and label reader is a Google component, and Google says it sends Google technical details about itself. It is not given your records.',
    'A backup is made only when you choose to make one. It is encrypted on the phone with your passphrase and goes only where you send it. Moving to your other phone sends your records, encrypted, straight to that phone on your Wi-Fi.',
    'The app has no ads, no analytics and no tracking, and we do not sell information about you.',
    'You can erase everything from Settings at any time.',
  ];
}

/** The full policy for the platform the app is on (MM-403): the health platform, the reader and the share sheet are named for what they are there. */
function sectionsOn(platform: Platform): readonly TermsSection[] {
  const ios = platform === 'ios';
  const health = healthPlatformName(platform);
  return [
    {
      heading: '1. Who this policy is from',
      paragraphs: [
        'This policy is from the developer of Martian Macros ("we"): [legal name of the developer, to be added]. It says what the app keeps, what it sends, to whom and when, and what you can do about it.',
        'Questions about this policy: [contact address, to be added].',
      ],
    },
    {
      heading: '2. What the app keeps, and where',
      paragraphs: [
        `Everything you enter (your profile, date of birth, sex, height, health answers, weigh-ins, measurements, nights of sleep, food log, workouts, check-ins and settings) and anything you let the app read from ${health} is kept in a database inside the app on this phone.`,
        'There is no account and no sign-in. We run no server that receives your records, so we cannot see them and we hold no copy of them to give anyone.',
        ios
          ? 'The database is left out of the iPhone’s own iCloud backup, so a new phone starts empty unless you restore a backup file you made (section 6).'
          : 'The database is left out of Android’s own backup, so a new phone starts empty unless you restore a backup file you made (section 6).',
      ],
    },
    {
      heading: `3. ${health}`,
      paragraphs: [
        `${health} is optional. If you allow it, the app reads only the kinds of data you allow from this list: weight, body fat, lean body mass, height, workouts, menstruation, steps and sleep.`,
        `What it reads is copied into the app’s database on this phone, is used only to work out your numbers in the app, and stays there until you erase it, even if you later take the permission away. It is not sent anywhere by the app, and it is not used for advertising.`,
        `The app writes to ${health} only the kinds you turn on in Settings, each with its own permission: the food you log, the water you log, the weight you type and the workouts you finish. It writes only what you logged in the app, and never changes or removes what another app wrote. What it wrote is then kept by ${health}. When you turn writing a kind off, the app asks whether to remove what it wrote of that kind; what you keep stays there, also when you erase the app’s data, until you remove it there.`,
      ],
    },
    {
      heading: '4. When the app uses the internet',
      paragraphs: [
        'The app makes a request over the internet only in the cases below, and each starts with you.',
        'The food database. When you ask to see which food databases are available, and again when you download one, your phone fetches a file from GitHub, which hosts them. GitHub sees your IP address, which file was asked for, when, and the technical details your phone sends with any download, such as its operating system. Nothing about you or your records is sent.',
        'Looking a food up online. If you allow it, when the food database on this phone does not have a food, the app sends the barcode number you scanned or typed, or the words you searched for, to Open Food Facts and, where the app offers it, to USDA FoodData Central. The request names the app, and the request to USDA FoodData Central carries a key issued to the app, not to you. Those services see your IP address and what was asked. Nothing about you or your records is sent. The app asks before the first lookup; you can choose always, just for now (until you close the app) or never, and change that in Settings, under Data. A food found this way is kept on this phone.',
        'Coaching phrasing with your own key. If you enter your own API key for Gemini, OpenAI or Anthropic in Settings, under Coach, the app sends the day’s or meal’s summary numbers and food names to the provider you chose, with your key, so it can phrase the coaching note. The model may ask the app for more while it writes, and the app answers from your data on the phone: the meal’s foods with their calories and macros, the foods you have logged at that meal, your week’s totals and training, and what it looks up in the food database. Those answers go to the provider too. The provider sees your IP address, your key and the summary sent with the request, under its own privacy policy. No request is made unless you enter a key, and you can remove the key at any time in Settings. The key is kept on this phone and is never in a backup file; it goes to your other phone only when you move to it.',
        'The public page, which is neither. In Settings, under About, "On the web" opens the page where this policy and the terms of use are published, in your phone’s browser. The browser fetches it, not the app, and the app hands it nothing but the page’s address. The page is hosted on GitHub Pages, so GitHub sees your IP address and what your browser sends with the request, under GitHub’s privacy policy and your browser’s own.',
        'Open Food Facts, USDA FoodData Central, Gemini, OpenAI, Anthropic and GitHub handle what they receive under their own privacy policies.',
      ],
    },
    {
      heading: '5. The camera, and the reader inside the app',
      paragraphs: [
        ios
          ? 'The camera is used only when you scan a barcode or photograph a nutrition label. Both are read on the phone by software that is part of iOS, and the label photo is not kept. If you take progress photos, the camera is used inside the app for those too: they are kept only in the app on this phone, never added to the phone’s photo library or its own backup, never analysed and never sent anywhere except to your other phone when you move to it, and they go into the app’s encrypted backup only if you turn that on.'
          : 'The camera is used only when you scan a barcode or photograph a nutrition label. Both are read on the phone, and a label photo is deleted as soon as it has been read. The barcode and label reader is a Google component, ML Kit. Google says that this component sends Google technical details about itself and the phone, such as the phone’s model, the operating system and app versions, an identifier for the installation, and performance and error information. It is not given your records. Google’s own policy covers what Google receives. If you take progress photos, the camera is used inside the app for those too: they are kept only in the app on this phone, never added to the phone’s photo library or its own backup, never analysed and never sent anywhere except to your other phone when you move to it, and they go into the app’s encrypted backup only if you turn that on.',
        ios
          ? 'The app runs inside the iPhone’s own web view, which is part of iOS. Apple’s policy, not this one, covers what iOS itself sends.'
          : 'The app runs inside Android’s own web view, which Google provides and updates. Google’s policy, not this one, covers what Android and its components send by themselves.',
      ],
    },
    {
      heading: '6. Backups you make',
      paragraphs: [
        'A backup is made only when you choose "Back up now" in Settings. The app copies its database on the phone and encrypts the copy with a passphrase you type. The passphrase is not stored, and we never see it. The file cannot be read without it, so choose one that is hard to guess; if you lose it, the backup cannot be opened, by you or by us.',
        ios
          ? 'The app then hands the encrypted file to the iPhone’s share sheet, and you choose where it goes: the Files app, a storage app, a message or an email. The app itself connects to no storage service. Whatever you choose receives the encrypted file and keeps it under its own terms and privacy policy.'
          : 'The app then hands the encrypted file to Android’s share menu, and you choose where it goes: a folder on the phone, a storage app, a message or an email. The app itself connects to no storage service. Whatever you choose receives the encrypted file and keeps it under its own terms and privacy policy.',
        'Restoring opens only the backup file you pick with the phone’s file picker. A downloaded food database is not in a backup.',
        'Move to another phone, in Settings under Backup, sends your records, your progress photos and the coach key you entered straight to your other phone on the same Wi-Fi, only when you choose it. Copy to another phone, from a food’s or a drink of water’s menu, sends only those foods or drinks and the saved foods they came from, the same way. The receiving phone shows a code holding a one-time key; everything the two phones exchange is encrypted with that key, and none of it goes over the internet or to any service of ours. The receiving phone asks before it replaces or adds what it holds.',
      ],
    },
    {
      heading: '7. Reminders',
      paragraphs: ['Reminders you turn on are scheduled by the phone itself. No message service is involved.'],
    },
    {
      heading: '8. The app stores',
      paragraphs: [
        ios
          ? 'You get the app and its updates from the App Store, under Apple’s privacy policy. If you agreed to share analytics with app developers in the iPhone’s settings, Apple may give us summary statistics and crash reports about the app. They do not include your records.'
          : 'You get the app and its updates from Google Play, under Google’s privacy policy. If you agreed to share usage and diagnostics in the phone’s settings, Google may give us summary statistics and crash reports about the app. They do not include your records.',
        'This version of the app sells nothing. If a purchase is added, the store will handle it, and this policy will first say what the app learns from it.',
      ],
    },
    {
      heading: '9. What we do not do',
      paragraphs: [
        'The app has no ads and no analytics or crash-reporting library of its own, and it does not track you across other apps or websites. We do not sell information about you or share it for advertising.',
        'If the app ever needs to send anything not described here, this policy will change first, and the app will show the new version.',
      ],
    },
    {
      heading: '10. Who can see your records',
      paragraphs: [
        'Your records are as private as your phone. The app does not add a password or a lock of its own, so anyone who can unlock your phone can open the app. Keep a screen lock on and keep the phone up to date.',
      ],
    },
    {
      heading: '11. Your choices',
      paragraphs: [
        'Settings, then "Erase all data and start over", deletes every record in the app and returns it to first use. Uninstalling the app removes them too. Erasing does not remove a food database you downloaded or what the app wrote to your phone’s health app, and does not change permissions you granted; you can withdraw those in the phone’s settings.',
        'Online lookups can be turned off at any time in Settings, under Data. A backup file you made is wherever you sent it, and is deleted there.',
        'Because we hold none of your records, there is nothing for us to show, correct or delete on request: all of it is on your phone, in your hands. You can still ask us anything about this policy at the address in section 1.',
      ],
    },
    {
      heading: '12. Children',
      paragraphs: [
        'The app is for adults 18 and over in the United States, and it is not meant for children. It relies on the date of birth you enter.',
      ],
    },
    {
      heading: '13. Changes to this policy',
      paragraphs: [
        'This policy comes with the app and the same text is published on the app’s public page, beside the terms of use. It can change only when the app is updated, and its version and the date it took effect are shown with it.',
      ],
    },
  ];
}

export const privacyPolicy = {
  /** Raised when the policy changes in a way that matters to the person. */
  version: 1,

  effectiveOn: CalendarDate.of(2026, 10, 21),

  /** The few things that matter most, said first and plainly. */
  summaryOn,

  /** The sections for the platform the app is on. */
  sectionsOn,

  /** The sections as on an Android phone, which is how a browser draws the app. */
  sections: sectionsOn('android'),
} as const;
