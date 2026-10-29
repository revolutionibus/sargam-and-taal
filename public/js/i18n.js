// Interface language. English text is the key; BN holds the Bangla for it.
// Changing the language in Settings reloads the page, so every string is
// translated once: static HTML by translatePage(), the rest through t().
(function (root) {
  'use strict';

  let lang = 'bn';
  try {
    const s = (JSON.parse(localStorage.getItem('taalStudio.v1')) || {}).settings;
    if (s && s.sargamLang) lang = s.sargamLang;
  } catch (e) { /* no saved language */ }

  const BN = {
    // ── Header & transport ──
    'Taal Studio': 'তাল স্টুডিও',
    'Player': 'প্লেয়ার',
    'Composer': 'কম্পোজার',
    'Sequences': 'সিকোয়েন্স',
    'Tuner': 'টিউনার',
    'Settings': 'সেটিংস',
    'Theme': 'থিম',
    'Play / Stop (Space)': 'বাজান / থামান (Space)',
    'Play': 'বাজান',
    'Stop': 'থামান',
    'Tempo': 'গতি',
    'Half tempo': 'অর্ধেক গতি',
    'Double tempo': 'দ্বিগুণ গতি',
    'Tap': 'ট্যাপ',
    'Tap tempo (T)': 'ট্যাপ করে গতি (T)',
    "Taal's default tempo": 'তালের নিজস্ব গতি',
    'Sa (pitch)': 'সা',
    'Down a semitone': 'এক সেমিটোন নিচে',
    'Up a semitone': 'এক সেমিটোন উপরে',
    'Fine tune (cents)': 'সূক্ষ্ম টিউন (সেন্ট)',
    'cents': 'সেন্ট',
    'Master': 'মাস্টার',
    'Now:': 'এখন:',
    'Avartan': 'আবর্তন',
    '· Time': '· সময়',
    'Vilambit': 'বিলম্বিত',
    'Madhya': 'মধ্য',
    'Drut': 'দ্রুত',
    'Ati-drut': 'অতি দ্রুত',

    // ── Player ──
    'Preset': 'প্রিসেট',
    'Presets': 'প্রিসেট',
    'on': 'চালু',
    'off': 'বন্ধ',
    'Choose taal': 'তাল বাছুন',
    'Sa': 'সা',
    'Tempo and volume': 'গতি ও ভলিউম',
    'Focus': 'ফোকাস',
    'Focus view while playing': 'বাজানোর সময় ফোকাস দৃশ্য',
    'Hides the settings while the taal plays and shows the current line large. Stop brings everything back.':
      'তাল বাজার সময় সেটিংস লুকিয়ে চলতি লাইনটি বড় করে দেখায়। থামালে সব আবার ফিরে আসে।',
    'Save as…': 'সেভ করুন…',
    'Delete': 'মুছুন',
    'Panels': 'প্যানেল',
    'Lehra': 'লহরা',
    'Tanpura': 'তানপুরা',
    'Swarmandal': 'স্বরমণ্ডল',
    'Keys': 'কিবোর্ড',
    'Keyboard and MIDI': 'কিবোর্ড ও MIDI',
    'Show the keyboard': 'কিবোর্ড দেখান',
    'Ati-mandra saptak': 'অতিমন্দ্র সপ্তক',
    'Mandra saptak': 'মন্দ্র সপ্তক',
    'Madhya saptak': 'মধ্য সপ্তক',
    'Taar saptak': 'তার সপ্তক',
    'Ati-taar saptak': 'অতিতার সপ্তক',
    'Taal': 'তাল',
    'Sargam practice': 'সারগাম অনুশীলন',
    'Sargam': 'সারগাম',
    'Swars of the line': 'লাইনের স্বর',
    'Drum mix and manjeera': 'বাদ্যের মিশ্রণ ও মন্দিরা',
    'Sargam practice (G)': 'সারগাম অনুশীলন (G)',
    'Close': 'বন্ধ করুন',
    'Close (G)': 'বন্ধ করুন (G)',
    'Volume': 'ভলিউম',
    'Auto-load lehra for taal': 'তাল অনুযায়ী লহরা নিজে থেকে বাছাই',
    'Tone': 'আওয়াজ',
    'Tanpuras': 'তানপুরার সংখ্যা',
    'Speed': 'গতি',
    'Randomize delays': 'বিরতি এলোমেলো করুন',
    'String delays (seconds)': 'তারের মাঝের বিরতি (সেকেন্ড)',
    'Strum': 'বাজান',
    'Strum now (S)': 'এখনই বাজান (S)',
    'Auto-strum on sam every': 'সমে নিজে বাজবে, প্রতি',
    'avartans': 'আবর্তনে',
    'Favourite': 'প্রিয়',
    'Drum': 'বাদ্য',
    'Taal default': 'তালের নিজস্ব',
    'Tabla': 'তবলা',
    'Pakhawaj': 'পাখোয়াজ',
    'Cajon': 'কাহন',
    'Metronome': 'মেট্রোনোম',
    'Metronome volume': 'মেট্রোনোমের ভলিউম',
    'Clicks per beat': 'প্রতি মাত্রায় ক্লিক',
    '1 per beat': 'মাত্রায় ১টি',
    '2 per beat': 'মাত্রায় ২টি',
    '3 per beat': 'মাত্রায় ৩টি',
    '4 per beat': 'মাত্রায় ৪টি',
    'Accent sam': 'সমে ঝোঁক',
    'Higher click on sam, and on each vibhag': 'সমে ও প্রতি বিভাগের শুরুতে উঁচু ক্লিক',
    'Start at beat': 'শুরুর মাত্রা',
    'Dayan': 'ডাঁয়া',
    'Bayan': 'বাঁয়া',
    'Tabla fine-tune': 'তবলার সূক্ষ্ম টিউন',
    'Manjeera': 'মন্দিরা',
    'Manjeera on': 'মন্দিরা বাজবে',
    'Every beat (vibhag accents)': 'প্রতি মাত্রায় (বিভাগে ঝোঁক)',
    'Custom positions': 'নিজের বাছাই করা জায়গায়',
    'Positions': 'জায়গা',
    '1 5 9 13 · 2.5 = half beat · 3c = closed': '1 5 9 13 · 2.5 = আধা মাত্রা · 3c = বন্ধ',
    'None': 'কোনোটি নয়',
    'No lehra for {n} beats': '{n} মাত্রার কোনো লহরা নেই',
    '{name} ({n} beats)': '{name} ({n} মাত্রা)',
    '{n} beats': '{n} মাত্রা',
    '{from} → {to} (on sam)': '{from} → {to} (সমে)',
    '★ Favourites': '★ প্রিয়',
    'Taals': 'তাল',
    'Compositions': 'কম্পজিশন',
    'My compositions': 'আমার কম্পজিশন',
    'Draft': 'খসড়া',
    'Choose…': 'বেছে নিন…',
    'No presets yet': 'এখনো কোনো প্রিসেট নেই',
    'Preset name': 'প্রিসেটের নাম',
    'Delete preset "{name}"?': 'প্রিসেট "{name}" মুছবেন?',

    // ── Sargam practice ──
    'Starts on sam': 'সম থেকে শুরু',
    'Back to top': 'উপরে যান',
    "Drag to change the editor's height (arrow keys too; double-click to reset)": 'টেনে সম্পাদকের উচ্চতা বদলান (অ্যারো কী-ও চলে; ডাবল-ক্লিকে আগের মাপে ফেরে)',
    'Drag to show more or fewer lines (or use the arrow keys)': 'টেনে বেশি বা কম লাইন দেখান (বা অ্যারো কী ব্যবহার করুন)',
    'One line = one avartan. Komal swars are underlined, tivra Ma has a mark above, dots show mandra (below) and taar (above) saptak, small raised swars are grace swars. Use headphones when checking your singing.':
      'এক লাইন = এক আবর্তন। তীব্র মা-র উপরে চিহ্ন, আর স্বরের নিচে ফোটা দিয়ে মন্দ্র বা উদারা সপ্তক (lower octave) ও উপরে ফোটা দিয়ে তারা সপ্তক বোঝানো হয়। ছোট করে উপরে লেখা স্বর হলো স্পর্শ স্বর। নিজের গান যাচাই করার সময় হেডফোন ব্যবহার করুন।',
    'Edit': 'সম্পাদনা',
    '+ New': '+ নতুন',
    'Write a new sargam line': 'নতুন সরগম লাইন লিখুন',
    'Discard the unsaved line?': 'সেভ না করা লাইনটি বাদ দেবেন?',
    'Show the line editor': 'লাইন সম্পাদক দেখান',
    'Name': 'নাম',
    'e.g. Yaman palta 1': 'যেমন: ইমন পাল্টা ১',
    'Save line': 'লাইন সেভ করুন',
    'Discard the changes and close the editor': 'পরিবর্তনগুলো বাদ দিয়ে সম্পাদক বন্ধ করুন',
    'Raga / thaat': 'রাগ / ঠাট',
    'Laya': 'লয়',
    'Barabar · 1 note / beat': 'বরাবর · মাত্রায় ১টি স্বর',
    'Dugun · 2 notes / beat': 'দুগুণ · মাত্রায় ২টি স্বর',
    'Tigun · 3 notes / beat': 'তিনগুণ · মাত্রায় ৩টি স্বর',
    'Chaugun · 4 notes / beat': 'চৌগুণ · মাত্রায় ৪টি স্বর',
    'Mode': 'ধরন',
    'Play along': 'সঙ্গে বাজবে',
    'Call & response': 'শুনুন এবং নিজে চেষ্টা করুন',
    'Notes only (you sing)': 'শুধু স্বরলিপি (আপনি গাইবেন)',
    'Instrument': 'বাদ্যযন্ত্র',
    'Play grace swars (kan)': 'স্পর্শ স্বর বাজান',
    'Meend length': 'মীড়ের দৈর্ঘ্য',
    'How much of the swar before / the slide takes (of its last step)': '/ এর আগের স্বরের কতটা জুড়ে মীড় হবে (তার শেষ ধাপের)',
    'Meend curve': 'মীড়ের ধরন',
    'Even': 'সমান',
    'Smooth (eases in and out)': 'মসৃণ (ধীরে শুরু, ধীরে শেষ)',
    'Late (lingers, then falls in)': 'দেরিতে (থেমে থেকে তারপর নামে)',
    'Early (leaves at once)': 'আগেভাগে (সঙ্গে সঙ্গে সরে যায়)',
    'Grace swars are the small raised swars, written <P>G': 'স্পর্শ স্বর হলো ছোট করে উপরে লেখা স্বর, লেখা হয় <P>G',
    'Check my singing (mic)': 'আমার গান যাচাই করুন (মাইক)',
    'Voice': 'কণ্ঠ',
    'Voice input': 'কণ্ঠ ইনপুট (মাইক)',
    'Your voice': 'আপনার কণ্ঠ',
    'Switch on to see where your voice is; while a sargam line plays, how close it is to the written swar.': 'চালু করলে দেখাবে আপনার কণ্ঠ কোন সুরে আছে; সারগাম লাইন বাজলে লেখা স্বরের কতটা কাছে।',
    'Sing or play a note.': 'একটি স্বর গান বা বাজান।',
    'against the written swar': 'লেখা স্বরের তুলনায়',
    'nearest swar to your Sa': 'আপনার সা থেকে নিকটতম স্বর',
    'Sing this swar.': 'এই স্বরটি গান।',
    'Check my playing (keys)': 'আমার বাজানো যাচাই করুন (কি)',
    'Play each swar on the keys on its beat (any octave); hover a swar for how early or late it was':
      'প্রতিটি স্বর তার মাত্রায় কি-তে বাজান (যেকোনো সপ্তকে); কত আগে বা পরে হলো দেখতে স্বরের ওপর মাউস রাখুন',
    'Timing': 'সময়',
    'How far from the beat a key still counts as on it': 'মাত্রা থেকে কতটা দূরে বাজালেও মাত্রায় ধরা হবে',
    'Strict · ±35 ms': 'কড়া · ±৩৫ ms',
    'Normal · ±70 ms': 'সাধারণ · ±৭০ ms',
    'Relaxed · ±120 ms': 'ঢিলে · ±১২০ ms',
    'Play swars from the keyboard': 'কিবোর্ড দিয়ে স্বর বাজান',
    'MIDI: {names}': 'MIDI: {names}',
    'No MIDI keyboard connected. The computer keys still work.': 'কোনো MIDI কিবোর্ড যুক্ত নেই। কম্পিউটারের কি দিয়ে বাজানো যাবে।',
    "This browser can't use MIDI keyboards. Use Chrome, Edge or Firefox on a computer or Android phone (no iPhone or iPad browser can). The computer keys still work here.":
      'এই ব্রাউজারে MIDI কিবোর্ড চলে না। কম্পিউটার বা অ্যান্ড্রয়েড ফোনে Chrome, Edge বা Firefox ব্যবহার করুন ' +
      '(আইফোন বা আইপ্যাডের কোনো ব্রাউজারে চলে না)। কম্পিউটারের কি দিয়ে এখানেও বাজানো যাবে।',
    "This device can't use MIDI keyboards.": 'এই ডিভাইসে MIDI কিবোর্ড চলে না।',
    'No MIDI keyboard connected. Plug one in with a USB OTG cable.':
      'কোনো MIDI কিবোর্ড যুক্ত নেই। USB OTG কেবল দিয়ে একটি লাগান।',
    'MIDI access was blocked. The computer keys still work.': 'MIDI ব্যবহারের অনুমতি দেওয়া হয়নি। কম্পিউটারের কি দিয়ে বাজানো যাবে।',
    'Octave up {n}': '{n} সপ্তক উপরে',
    'Octave down {n}': '{n} সপ্তক নিচে',
    'Sa on the MIDI keyboard': 'MIDI কিবোর্ডে সা',
    'Choose key…': 'কি বাছুন…',
    'Cancel': 'বাতিল',
    'Real pitch': 'আসল সুর',
    'Press the key you want to be Sa in MIDI': 'MIDI তে যে বোতামটিকে সা বানাতে চান সেটি চাপুন…',
    'Real pitch: the key matching your Sa plays Sa': 'আসল সুর: আপনার সা-এর সুরের কি-টি সা বাজায়',
    'Sa is on {key}': 'সা আছে {key} কি-তে',
    'Write what I play into the line editor': 'যা বাজাই তা লাইন এডিটরে লিখে রাখুন',
    'Write a - for each step a swar is held': 'স্বর যত ধাপ ধরে রাখি ততগুলো - লিখুন',
    'Without the taal, write in time with the taal and tempo': 'তাল ছাড়াও তাল ও গতি অনুযায়ী সময় ধরে লিখুন',
    "At the tempo and Laya: a swar held for three notes' time is written S - -": 'গতি ও লয় অনুযায়ী: তিন স্বরের সময় ধরে রাখা স্বর লেখা হয় S - -',
    'Loop': 'লুপ',
    'All lines': 'সব লাইন',
    'Selected lines': 'বাছাই করা লাইন',
    'Clear': 'বাছাই মুছুন',
    'Click lines to choose them for the loop. None chosen yet, so every line plays.':
      'লুপের জন্য লাইনে ক্লিক করে বাছাই করুন। এখনো কোনোটি বাছাই হয়নি, তাই সব লাইন বাজবে।',
    'Looping line {list}. Click lines to add or remove them.': 'লুপে চলছে লাইন {list}। যোগ বা বাদ দিতে লাইনে ক্লিক করুন।',
    'Looping lines {list}. Click lines to add or remove them.': 'লুপে চলছে লাইন {list}। যোগ বা বাদ দিতে লাইনে ক্লিক করুন।',
    'Line {n}: click to add to the loop or remove': 'লাইন {n}: লুপে যোগ বা বাদ দিতে ক্লিক করুন',
    'Alankars': 'অলংকার',
    'My lines': 'আমার লাইন',
    'List': 'তালিকা',
    'e.g. Kaharba lessons': 'যেমন কাহারবা পাঠ',
    'Default taal': 'ডিফল্ট তাল',
    'No default taal': 'কোনো ডিফল্ট তাল নেই',
    'Selecting this line switches to its taal; you can still change the taal afterwards': 'এই লাইন বাছলে তার তাল চালু হয়; পরে তাল বদলাতে পারবেন',
    'Search sargams by name or list…': 'নাম বা তালিকা দিয়ে সরগম খুঁজুন…',
    'No sargam found': 'কোনো সরগম পাওয়া যায়নি',
    '{n} more — type more to narrow the search': 'আরও {n}টি — আরও লিখে খোঁজ ছোট করুন',
    'Add to or remove from favourites': 'প্রিয় তালিকায় যোগ করুন বা সরান',
    'Your own': 'নিজের',
    'New custom line…': 'নতুন নিজের লাইন…',
    'Give the line a name first.': 'আগে লাইনের একটি নাম দিন।',
    'Write some swars first.': 'আগে কিছু স্বর লিখুন।',
    'Fix the errors before saving.': 'সেভ করার আগে ভুলগুলো ঠিক করুন।',
    'Saving…': 'সেভ হচ্ছে…',
    'Saved to {file}.': '{file}-এ সেভ হয়েছে।',
    'Unsaved changes': 'পরিবর্তন সেভ করা হয়নি',
    'Saved in this browser (Settings → Export all to back it up).': 'এই ব্রাউজারে সেভ হয়েছে (ব্যাকআপের জন্য রচনা → সব এক্সপোর্ট)।',
    'Saved in this browser only (start the app with ./run.sh to save to the file).': 'শুধু এই ব্রাউজারে সেভ হয়েছে (ফাইলে সেভ করতে ./run.sh দিয়ে অ্যাপ চালু করুন)।',
    'Delete the line "{name}"?': '"{name}" লাইনটি মুছবেন?',
    'A note at beat {beat} of line {line} runs past the avartan: it holds on into the next line, but is cut at sam when another line comes next (looping selected lines, call & response).':
      '{line} নম্বর লাইনের {beat} মাত্রার একটি স্বর আবর্তন ছাড়িয়ে যায়: সেটি পরের লাইনে টানা বাজে, তবে পরে অন্য লাইন এলে (বাছাই করা লাইন লুপ, কল ও রেসপন্স) সমে কেটে যায়।',
    '{n} of {total} lines': '{total}টির মধ্যে {n}টি লাইন',
    'Your turn — sing it back': 'আপনার পালা — গেয়ে শোনান',
    'Listen': 'শুনুন',
    'Sing — line {n}': 'গান — লাইন {n}',
    'Sing along — line {n}': 'সঙ্গে গান — লাইন {n}',
    'In tune': 'সুরে',
    'Low': 'নিচু',
    'High': 'উঁচু',
    'Missed': 'বাদ গেছে',
    'On the beat': 'মাত্রায়',
    'Early': 'আগে',
    'Late': 'পরে',
    'Wrong swar': 'ভুল স্বর',
    'On the beat on average': 'গড়ে মাত্রায়',
    '{ms} ms early on average': 'গড়ে {ms} ms আগে',
    '{ms} ms late on average': 'গড়ে {ms} ms পরে',
    'Microphone unavailable: {err}\nAllow this site to use the microphone in your browser, then try again.':
      'মাইক্রোফোন পাওয়া যাচ্ছে না: {err}\nব্রাউজারে এই সাইটকে মাইক্রোফোনের অনুমতি দিন, তারপর আবার চেষ্টা করুন।',
    "Microphone unavailable: {err}\nAllow the microphone for Taal Studio in your phone's settings.":
      'মাইক্রোফোন পাওয়া যাচ্ছে না: {err}\nফোনের সেটিংসে তাল স্টুডিওকে মাইক্রোফোনের অনুমতি দিন।',

    // ── Composer ──
    'Compose a taal or composition': 'তাল বা রচনা তৈরি করুন',
    'My Kayda': 'আমার কায়দা',
    'Vibhag marks': 'বিভাগ চিহ্ন',
    'Default tempo': 'নিজস্ব গতি',
    'Bols': 'বোল',
    'Play in player': 'প্লেয়ারে বাজান',
    'Save': 'সেভ করুন',
    'New': 'নতুন',
    'Bol keyboard': 'বোল কিবোর্ড',
    '— click to hear and insert': '— ক্লিক করলে শোনা যাবে ও লেখায় বসবে',
    'Export all…': 'সব এক্সপোর্ট…',
    'Import…': 'ইমপোর্ট…',
    'Share…': 'শেয়ার…',
    'Share all lines…': 'সব লাইন শেয়ার…',
    'Share all compositions…': 'সব রচনা শেয়ার…',
    'Save all your sargam lines as one file to share': 'আপনার সব সরগম লাইন একটি ফাইলে শেয়ারের জন্য সেভ করুন',
    'Save all your compositions as one file to share': 'আপনার সব রচনা একটি ফাইলে শেয়ারের জন্য সেভ করুন',
    'Back up compositions, sequences, presets and sargam lines': 'রচনা, সিকোয়েন্স, প্রিসেট ও সরগম লাইনের ব্যাকআপ নিন',
    'Save this line as a file to share': 'লাইনটি শেয়ার করার জন্য ফাইল হিসেবে সেভ করুন',
    'Save this composition as a file to share': 'রচনাটি শেয়ার করার জন্য ফাইল হিসেবে সেভ করুন',
    'Add sargam lines or compositions from a shared file': 'শেয়ার করা ফাইল থেকে সরগম লাইন বা রচনা যোগ করুন',
    'nothing to import in this file': 'এই ফাইলে ইমপোর্ট করার মতো কিছু নেই',
    'Group: wraps the selection, or opens a group': 'দল: বাছাই করা অংশ ঘিরে দেয়, বা নতুন দল খোলে',
    'Accent: play the previous bol louder': 'ঝোঁক: আগের বোলটি জোরে বাজবে',
    'Soft: play the previous bol softer': 'নরম: আগের বোলটি আস্তে বাজবে',
    'Gap: a silent stroke that takes its share of the group': 'ফাঁক: নিঃশব্দ আঘাত, দলের মধ্যে নিজের ভাগ নেয়',
    'Recording 2 of the previous bol': 'আগের বোলের ২ নম্বর রেকর্ডিং',
    'Recording 3 of the previous bol': 'আগের বোলের ৩ নম্বর রেকর্ডিং',
    'Length: the previous group lasts 1 beat': 'দৈর্ঘ্য: আগের দলটি ১ মাত্রা চলবে',
    'Length: the previous group lasts 2 beats': 'দৈর্ঘ্য: আগের দলটি ২ মাত্রা চলবে',
    'Length: the previous group lasts half a beat': 'দৈর্ঘ্য: আগের দলটি আধা মাত্রা চলবে',
    'Untitled': 'নামহীন',
    ' · {m} marks for {v} vibhags': ' · {v}টি বিভাগের জন্য {m}টি চিহ্ন',
    '{b} beats in {v} vibhags ({sum})': '{v}টি বিভাগে {b} মাত্রা ({sum})',
    'Nothing saved yet. Built-in taals can be opened from here too:': 'এখনো কিছু সেভ করা হয়নি। এখান থেকে অ্যাপের তালও খোলা যায়:',
    'Open a built-in taal as a starting point…': 'অ্যাপে দেয়া একটি তাল নিয়ে শুরু করুন',
    '{name} (copy)': '{name} (কপি)',
    '{name} (draft)': '{name} (খসড়া)',
    'saving…': 'সেভ হচ্ছে…',
    'saved to {file}': '{file}-এ সেভ হয়েছে',
    'Delete "{name}"?': '"{name}" মুছবেন?',
    'Could not import: {err}': 'ইমপোর্ট করা যায়নি: {err}',
    'Could not export: {err}': 'এক্সপোর্ট করা যায়নি: {err}',

    // ── Sequences ──
    'New sequence': 'নতুন সিকোয়েন্স',
    'Sequence editor': 'সিকোয়েন্স সম্পাদক',
    'Practice set': 'অনুশীলন সেট',
    'Loop the whole sequence': 'পুরো সিকোয়েন্স বারবার চলবে',
    'Taal / composition': 'তাল / রচনা',
    'Repeat': 'পুনরাবৃত্তি',
    '+ Add step': '+ ধাপ যোগ করুন',
    'Play sequence': 'সিকোয়েন্স বাজান',
    'Leave tempo blank to keep the current tempo. Steps change on sam.': 'বর্তমান গতি রাখতে গতির ঘর ফাঁকা রাখুন। ধাপ বদলায় সমে।',
    'No sequences yet.': 'এখনো কোনো সিকোয়েন্স নেই।',
    '{n} steps': '{n}টি ধাপ',
    'Move up': 'উপরে সরান',
    'Move down': 'নিচে সরান',
    'Remove': 'সরিয়ে দিন',
    'Sequence {n}': 'সিকোয়েন্স {n}',

    // ── Tuner ──
    'Pitch detector': 'সুর শনাক্তকারী',
    "Sing or play a steady Sa, then set it as the app's Sa.": 'স্থির ভাবে সা গান বা বাজান, তারপর সেটিকে অ্যাপের সা করুন।',
    'Start listening': 'শোনা শুরু করুন',
    'Stop listening': 'শোনা বন্ধ করুন',
    'Set Sa to this pitch': 'এই সুরকে সা করুন',
    'Hear current Sa': 'বর্তমান সা শুনুন',
    'Made by': 'তৈরি করেছেন',
    '{swar} relative to your Sa ({c}¢)': 'আপনার সা অনুযায়ী {swar} ({c}¢)',

    // ── Settings ──
    'Playback': 'বাজানো',
    'Fade out audio when stopping': 'থামানোর সময় আওয়াজ ধীরে মিলিয়ে যাবে',
    'Stop button': 'থামানোর বোতাম',
    'Stops immediately': 'সঙ্গে সঙ্গে থামবে',
    'Finishes the avartan and ends on sam': 'আবর্তন শেষ করে সমে থামে',
    'Accent the sam': 'সমে ঝোঁক দিন',
    'Sound previews in the bol keyboard': 'বোল কিবোর্ডে শব্দ শোনাবে',
    'Language': 'ভাষা',
    'App and sargam names': 'অ্যাপ ও সরগমের নাম',
    'Samples': 'নমুনা',
    'Keyboard shortcuts': 'কিবোর্ড শর্টকাট',
    'Reset': 'রিসেট',
    'Reset all settings to default': 'সব সেটিংস শুরুর অবস্থায় ফেরান',
    'Compositions, sequences and presets are kept.': 'রচনা, সিকোয়েন্স ও প্রিসেট থেকে যাবে।',
    'Reset all settings to their defaults?': 'সব সেটিংস শুরুর অবস্থায় ফেরাবেন?',
    'Theme and language': 'থিম ও ভাষা',
    'Follows system': 'সিস্টেম অনুযায়ী',
    'Light': 'হালকা',
    'Dark': 'গাঢ়',
    'Theme: follows system': 'থিম: সিস্টেম অনুযায়ী',
    'Theme: light': 'থিম: হালকা',
    'Theme: dark': 'থিম: গাঢ়',
    '{title} (click to change)': '{title} (বদলাতে ক্লিক করুন)',
    '{n} samples loaded': '{n}টি নমুনা লোড হয়েছে',
    ', {n} missing (synthesized instead).': ', {n}টি পাওয়া যায়নি (তার বদলে কৃত্রিম শব্দ)।',
    '.': '।',
    'Browsers block loading sound files from file://. Start the app with ./run.sh to use the real samples — using synthesized sounds for now.':
      'ব্রাউজার file:// থেকে সাউন্ড ফাইল লোড করতে দেয় না। আসল নমুনা পেতে ./run.sh দিয়ে অ্যাপ চালু করুন — আপাতত কৃত্রিম শব্দ বাজছে।',
    'No samples found in sounds/ — using synthesized sounds for now.':
      'sounds/ ফোল্ডারে কোনো নমুনা নেই — আপাতত কৃত্রিম শব্দ বাজছে।',

    // ── Notation errors ──
    '{msg} in beat {beat}': '{beat} নম্বর মাত্রায় {msg}',
    'Bad "{tok}"': 'ভুল "{tok}"',
    'Bad length [{v}]': 'ভুল দৈর্ঘ্য [{v}]',
    'Unknown bol "{bol}"': 'অজানা বোল "{bol}"',
    'Vibhag {n} ends partway through a beat ({pos} beats)': '{n} নম্বর বিভাগ একটি মাত্রার মাঝখানে শেষ হয় ({pos} মাত্রা)',
    'Bad swar "{tok}" in beat {beat}': '{beat} নম্বর মাত্রায় ভুল স্বর "{tok}"',
    '"{tok}" has no swar': '"{tok}"-এ কোনো স্বর নেই',
    'Bad length [{v}] in "{tok}"': '"{tok}"-এ ভুল দৈর্ঘ্য [{v}]',
    'Bad swar "{tok}"': 'ভুল স্বর "{tok}"',
    '"{sym}" in "{tok}" needs a swar before it': '"{tok}"-এ "{sym}"-এর আগে একটি স্বর লাগবে',
    '"{sym}" must be followed by a swar, not "{tok}"': '"{sym}"-এর পরে একটি স্বর লাগবে, "{tok}" নয়',
    '"{sym}" at the end needs a swar after it': 'শেষের "{sym}"-এর পরে একটি স্বর লাগবে',
    '"<…>" must be followed by a swar, not "{tok}"': '"<…>"-এর পরে একটি স্বর লাগবে, "{tok}" নয়',
    '"<…>" at the end needs a swar after it': 'শেষের "<…>"-এর পরে একটি স্বর লাগবে',
    'Bad position "{tok}"': 'ভুল জায়গা "{tok}"',

    // ── Built-in names (data.js) ──
    'Tanpura 1 (warm)': 'তানপুরা ১ (উষ্ণ)',
    'Tanpura 2 (bright)': 'তানপুরা ২ (উজ্জ্বল)',
    'Tanpura 3 (open)': 'তানপুরা ৩ (খোলা)',
    'Pa Sa Sa Sa': 'পা সা সা সা',
    'Ma Sa Sa Sa': 'মা সা সা সা',
    'Ma(tivra) Sa Sa Sa': 'হ্ম সা সা সা',
    'Ni Sa Sa Sa': 'না সা সা সা',
    'ni(komal) Sa Sa Sa': 'ণা সা সা সা',
    'Dha Sa Sa Sa': 'ধা সা সা সা',
    'Sa Sa Sa Sa': 'সা সা সা সা',
    'Pa ni(komal) Sa Sa': 'পা ণা সা সা',
    'Pa Ni Sa Sa': 'পা না সা সা',
    'Ma Pa Sa Sa': 'মা পা সা সা',
    'Teentaal': 'তিনতাল',
    'Ektaal': 'একতাল',
    'Jhaptaal': 'ঝাঁপতাল',
    'Rupak': 'রূপক',
    'Dadra': 'দাদরা',
    'Keherwa': 'কাহারবা',
    'Jhoomra': 'ঝুমরা',
    'Deepchandi': 'দীপচন্দী',
    'Tilwada': 'তিলওয়াড়া',
    'Addha Teentaal': 'আদ্ধা তিনতাল',
    'Dhamar': 'ধামার',
    'Chautaal': 'চৌতাল',
    'Sooltaal': 'সুলতাল',
    'Kayda — DhaDha TiTa (Teentaal)': 'কায়দা — ধাধা তিটা (তিনতাল)',
    'Cajon — Basic rock': 'কাহন — সাধারণ রক',
    'Cajon — Rock with ghost notes': 'কাহন — ঘোস্ট নোটসহ রক',
    'Cajon — Slow ballad (2 bars)': 'কাহন — ধীর ব্যালাড (২ বার)',
    'Cajon — Pop / funk 16ths': 'কাহন — পপ / ফাঙ্ক ১৬তম',
    'Cajon — 6/8 groove': 'কাহন — ৬/৮ গ্রুভ',
    'Cajon — Fill into a chorus': 'কাহন — কোরাসে ঢোকার ফিল',
    'Cajon — Tihai ending': 'কাহন — তিহাই দিয়ে শেষ',
    'Harmonium': 'হারমোনিয়াম',
    'Santoor': 'সন্তুর',
    'Piano': 'পিয়ানো',
    'Banjo': 'ব্যাঞ্জো',
    'Violin 1': 'বেহালা ১',
    'Violin 2': 'বেহালা ২',
    'Yaman': 'ইমন',
    'Yaman / Kalyan': 'ইমন / কল্যাণ',
    'Bilawal': 'বিলাবল',
    'Khamaj': 'খাম্বাজ',
    'Kafi': 'কাফি',
    'Asavari': 'আশাবরী',
    'Bhairavi': 'ভৈরবী',
    'Bhairav': 'ভৈরব',
    'Purvi': 'পূরবী',
    'Marwa': 'মারবা',
    'Todi': 'টোড়ি',
    'Kirwani': 'কিরওয়ানি',
    'Bhupali': 'ভূপালি',
    'Durga': 'দুর্গা',
    'Malkauns': 'মালকোষ',
    'Pahadi': 'পাহাড়ি',
    'Aroha–avaroha (S R G M …)': 'আরোহ–অবরোহ (স র গ ম …)',
    'Pairs (SR RG GM …)': 'জোড়া (সর রগ গম …)',
    'Threes (SRG RGM …)': 'তিনটি করে (সরগ রগম …)',
    'Fours (SRGM RGMP …)': 'চারটি করে (সরগম রগমপ …)',
    'Skips (SG RM GP …)': 'একটি বাদ দিয়ে (সগ রম গপ …)',
    'Turns (SGR RMG …)': 'ঘুরিয়ে (সগর রমগ …)',
    'Zig-zag (SGRM RMGP …)': 'আঁকাবাঁকা (সগরম রমগপ …)',
    'Return (SRGRS RGMGR …)': 'ফিরতি (সরগরস রগমগর …)',
  };

  // Help text with markup, for elements marked data-i18n="<key>".
  const BN_HTML = {
    sargamHint: 'বন্ধনীর ভেতরের স্বরগুলো এক মাত্রা ভাগ করে নেয়: <code>S R (GM) P (DNS\')</code>। ' +
      '<code>[beats]</code> দিয়ে দৈর্ঘ্য ঠিক হয়, যা বদলানো পর্যন্ত চলতে থাকে: <code>S[0.5] R G M[2]</code>। ' +
      '<code>-</code> আগের স্বর ধরে রাখে, <code>~</code> হলো বিরাম। ' +
      '<code>S^R</code> নতুন আঘাত ছাড়া রে-তে যায়, <code>D/S\'</code> গড়িয়ে র্সা-তে ওঠে (মীড়)।',
    bolsHelp: '— মাত্রাগুলো স্পেস দিয়ে, বিভাগগুলো “|” দিয়ে আলাদা। এক মাত্রায় কয়েকটি বোল থাকলে তারা মাত্রাটি ভাগ করে নেয়: ' +
      '<code>TiRaKiTa</code>, <code>DhaGe</code>। “-” হলো বিরাম। <code>(Na---)[1]</code> একটি দলকে ১ মাত্রায় বসায়, ' +
      '<code>(Dha|Dha2)</code> এলোমেলোভাবে একটি বাছে, <code>Dha2</code> = ২ নম্বর রেকর্ডিং, <code>#</code> জোরে, <code>*</code> আস্তে।',
    shortcuts: '<kbd>Space</kbd> বাজান/থামান · <kbd>↑</kbd>/<kbd>↓</kbd> গতি ±১ (<kbd>Shift</kbd> ±১০) · ' +
      '<kbd>T</kbd> ট্যাপ করে গতি · <kbd>S</kbd> স্বরমণ্ডল বাজান · <kbd>[</kbd>/<kbd>]</kbd> সা নিচে/উপরে · ' +
      '<kbd>G</kbd> সরগম প্যানেল · “কিবোর্ড” চালু থাকলে অক্ষরের কিগুলো স্বর বাজায়',
    keysHelp: 'ওপরে বাছাই করা বাদ্যযন্ত্র বাজবে। <kbd>A</kbd> হলো সা, <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> ' +
      '<kbd>H</kbd> <kbd>J</kbd> হলো রে গা মা পা ধা নি, আর <kbd>K</kbd> তার সা; ওপরের সারির কিগুলো (<kbd>W</kbd> <kbd>E</kbd> ' +
      '<kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd>) কোমল স্বর ও তীব্র মা। <kbd>Z</kbd>/<kbd>X</kbd> দিয়ে এক সপ্তক নিচে/উপরে। ' +
      'MIDI কিবোর্ড নিজের সুরেই বাজে, যদি না নিচে তার জন্য সা-এর কি বেছে নিন। সাসটেইন প্যাডেলও ব্যবহার করা যাবে ।',
    keysWriteHelp: 'লাইন এডিটর খোলা থাকলে যে স্বর বাজাবেন তা কার্সরের জায়গায় লেখা হবে, আর যত ধাপ ধরে রাখবেন ' +
      'ততগুলো <code>-</code> বসবে (গতি ও লয় অনুযায়ী)। তাল বাজার সময় (বা সেই বিকল্প চালু থাকলে, তাল বন্ধ থাকলেও প্রথম স্বরকে সম ধরে তালের গতিতে) যা বাজাবেন সবই সঙ্গে সঙ্গে স্বরলিপিতে লেখা হবে, ' +
      'প্রতি আবর্তনে একটি লাইন: দ্রুত স্বর <code>(SR)</code> এর মতো দল হিসেবে, টানা <code>-</code>, বিরাম <code>~</code>। কম্পিউটারের কি দিয়ে বাজাতে ' +
      'লেখার বাক্সের বাইরে ক্লিক করুন; তখন <kbd>-</kbd> স্বর ধরে রাখে, <kbd>\\</kbd> একটি <code>|</code> বসায় ' +
      'আর <kbd>Backspace</kbd> শেষ স্বরটি মুছে দেয়।',
  };

  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  // Digits in the interface language: num(12) -> "১২".
  function num(v) {
    const s = String(v);
    return lang === 'bn' ? s.replace(/[0-9]/g, (d) => BN_DIGITS[d]) : s;
  }

  // t('{n} beats', { n: 16 }) -> "১৬ মাত্রা". Number values get the
  // language's digits; strings (bols, names) are inserted as they are.
  function t(text, vars) {
    let s = (lang === 'bn' && BN[text]) || text;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, (m, k) => {
        if (!(k in vars)) return m;
        return typeof vars[k] === 'number' ? num(vars[k]) : vars[k];
      });
    }
    return s;
  }

  // Translate the static page: text nodes and title / placeholder /
  // aria-label attributes whose English text is in BN, plus data-i18n blocks.
  function translatePage(el) {
    document.documentElement.lang = lang;
    if (lang !== 'bn') return;
    const key = (s) => s.replace(/\s+/g, ' ').trim();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const p = n.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEXTAREA') continue;
      const k = key(n.nodeValue);
      if (BN[k]) n.nodeValue = n.nodeValue.replace(/\S[\s\S]*\S|\S/, BN[k]);
    }
    el.querySelectorAll('[title], [placeholder], [aria-label]').forEach((e) => {
      for (const a of ['title', 'placeholder', 'aria-label']) {
        const v = e.getAttribute(a);
        if (v && BN[key(v)]) e.setAttribute(a, BN[key(v)]);
      }
    });
    el.querySelectorAll('[data-i18n]').forEach((e) => {
      if (BN_HTML[e.dataset.i18n]) e.innerHTML = BN_HTML[e.dataset.i18n];
    });
    document.title = t('Taal Studio');
  }

  root.I18n = { lang, t, num, translatePage };
  // The scripts sit at the end of <body>, so the page is already parsed.
  if (typeof document !== 'undefined' && document.body) translatePage(document.body);
})(this);
