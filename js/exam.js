/* TIS প্রতিদিন+ — full-marks written answer builder (Bank / BCS written format)
   Facts come from the day's news; background/impact/recommendation come from a topic library. */
(() => {
'use strict';
// [id, regex, বাংলা{name,bg,imp,bd,rec,end}, English{...}]
const TOPICS = [
 ['climate', /\bCOP\d*\b|climate|জলবায়ু|UNFCCC|carbon|emission|কার্বন|নিঃসরণ|global warming/i,
  { name: 'জলবায়ু পরিবর্তন ও বৈশ্বিক জলবায়ু সম্মেলন',
    bg: ['জাতিসংঘ জলবায়ু পরিবর্তন কাঠামো সনদ (UNFCCC)-এর সদস্য দেশগুলোর বার্ষিক সম্মেলনই COP (Conference of the Parties)।', '২০১৫ সালের প্যারিস চুক্তিতে বৈশ্বিক উষ্ণতা প্রাক-শিল্পযুগের তুলনায় ২° সেলসিয়াসের নিচে, সম্ভব হলে ১.৫°-এ সীমিত রাখার লক্ষ্য নির্ধারিত হয়।'],
    imp: ['কার্বন নিঃসরণ কমানোর বৈশ্বিক লক্ষ্য অর্জন অনিশ্চিত হয়ে পড়ে।', 'জলবায়ু অর্থায়ন ও “লস অ্যান্ড ড্যামেজ” তহবিলের প্রতিশ্রুতি বাস্তবায়ন বিলম্বিত হয়।', 'উন্নত ও উন্নয়নশীল দেশের মধ্যে আস্থার সংকট বাড়ে।'],
    bd: ['বাংলাদেশ জলবায়ু পরিবর্তনে সবচেয়ে ঝুঁকিপূর্ণ দেশগুলোর একটি — সমুদ্রপৃষ্ঠের উচ্চতা বৃদ্ধি, লবণাক্ততা, ঘূর্ণিঝড় ও বন্যা বড় হুমকি।', 'বাংলাদেশ ক্লাইমেট ভালনারেবল ফোরাম (CVF)-এর সদস্য এবং অভিযোজনে (Adaptation) সাফল্যের জন্য আন্তর্জাতিকভাবে পরিচিত।'],
    rec: ['উন্নত দেশগুলোর প্রতিশ্রুত জলবায়ু অর্থায়ন দ্রুত ও অনুদান আকারে ছাড় করা।', 'লস অ্যান্ড ড্যামেজ তহবিলে ঝুঁকিপূর্ণ দেশগুলোর সহজ প্রবেশাধিকার নিশ্চিত করা।', 'নবায়নযোগ্য জ্বালানিতে বিনিয়োগ ও আঞ্চলিক সহযোগিতা জোরদার করা।'],
    end: 'জলবায়ু পরিবর্তন কোনো একক দেশের সমস্যা নয়; বৈশ্বিক ঐকমত্য ও ন্যায্য অর্থায়নই বাংলাদেশের মতো ঝুঁকিপূর্ণ দেশের টিকে থাকার পথ।' },
  { name: 'Climate change and global climate negotiations',
    bg: ['COP (Conference of the Parties) is the annual meeting of the countries that are party to the UN Framework Convention on Climate Change (UNFCCC).', 'The 2015 Paris Agreement aims to keep global warming well below 2°C, preferably 1.5°C, above pre-industrial levels.'],
    imp: ['Global emission-reduction targets become harder to achieve.', 'Delivery of climate finance and the Loss and Damage fund may be delayed.', 'Trust between developed and developing nations weakens.'],
    bd: ['Bangladesh is among the most climate-vulnerable countries, facing sea-level rise, salinity, cyclones and floods.', 'Bangladesh is a member of the Climate Vulnerable Forum (CVF) and is widely cited for its adaptation efforts.'],
    rec: ['Developed countries must release promised climate finance quickly, mainly as grants.', 'Vulnerable countries need easy access to the Loss and Damage fund.', 'Investment in renewable energy and regional cooperation should be scaled up.'],
    end: 'Climate change is a shared crisis; global consensus and fair finance are essential for the survival of vulnerable nations like Bangladesh.' }],
 ['monetary', /Bangladesh Bank|বাংলাদেশ ব্যাংক|policy rate|নীতি সুদ|\brepo\b|রেপো|inflation|মূল্যস্ফীতি|খেলাপি|NPL|non-performing|default loan|\breserves?\b|রিজার্ভ|remittance|রেমিট্যান্স|exchange rate|বিনিময় হার|monetary|মুদ্রানীতি|ব্যাংক একীভূত|merger/i,
  { name: 'ব্যাংকিং খাত ও মুদ্রানীতি',
    bg: ['বাংলাদেশ ব্যাংক দেশের কেন্দ্রীয় ব্যাংক; মুদ্রানীতি প্রণয়ন, মূল্যস্থিতিশীলতা রক্ষা ও ব্যাংক খাত তদারকি এর প্রধান দায়িত্ব।', 'নীতি সুদহার, CRR, SLR ও খোলাবাজার কার্যক্রম মুদ্রানীতির প্রধান হাতিয়ার।'],
    imp: ['সুদহার ও তারল্য পরিস্থিতির পরিবর্তন সরাসরি ঋণপ্রবাহ, বিনিয়োগ ও মূল্যস্ফীতিতে প্রভাব ফেলে।', 'খেলাপি ঋণ বাড়লে ব্যাংকের মূলধন ঘাটতি ও আস্থার সংকট তৈরি হয়।', 'রিজার্ভ ও বিনিময় হারের স্থিতিশীলতা আমদানি ব্যয় ও বৈদেশিক দায় পরিশোধের সক্ষমতা নির্ধারণ করে।'],
    bd: ['উচ্চ মূল্যস্ফীতি নিয়ন্ত্রণ, খেলাপি ঋণ হ্রাস ও ব্যাংক খাতে সুশাসন প্রতিষ্ঠা বর্তমানে বাংলাদেশের বড় চ্যালেঞ্জ।', 'রেমিট্যান্স ও রপ্তানি আয় বৈদেশিক মুদ্রার রিজার্ভের প্রধান উৎস।'],
    rec: ['খেলাপি ঋণ আদায়ে আইনি প্রক্রিয়া দ্রুত করা ও ইচ্ছাকৃত খেলাপিদের জবাবদিহির আওতায় আনা।', 'কেন্দ্রীয় ব্যাংকের স্বাধীনতা ও তদারকি সক্ষমতা জোরদার করা।', 'বৈধ পথে রেমিট্যান্স প্রবাহ উৎসাহিত করা এবং বাজারভিত্তিক বিনিময় হার বজায় রাখা।'],
    end: 'একটি শক্তিশালী, স্বচ্ছ ও জবাবদিহিমূলক ব্যাংক খাতই টেকসই অর্থনৈতিক প্রবৃদ্ধির ভিত্তি।' },
  { name: 'Banking sector and monetary policy',
    bg: ['Bangladesh Bank is the central bank, responsible for monetary policy, price stability and supervision of banks.', 'The policy rate, CRR, SLR and open-market operations are the main tools of monetary policy.'],
    imp: ['Changes in interest rates and liquidity directly affect credit flow, investment and inflation.', 'Rising non-performing loans erode bank capital and public confidence.', 'Stable reserves and exchange rates determine the capacity to pay for imports and external debt.'],
    bd: ['Controlling high inflation, reducing defaulted loans and ensuring good governance in banks are major challenges for Bangladesh.', 'Remittances and export earnings are the main sources of foreign-exchange reserves.'],
    rec: ['Speed up loan recovery through courts and hold wilful defaulters accountable.', 'Strengthen the independence and supervisory capacity of the central bank.', 'Encourage remittances through formal channels and keep a market-based exchange rate.'],
    end: 'A strong, transparent and accountable banking sector is the foundation of sustainable growth.' }],
 ['ifi', /\bIMF\b|World Bank|\bADB\b|AIIB|আইএমএফ|বিশ্বব্যাংক|এডিবি|loan programme|ঋণ কর্মসূচি/i,
  { name: 'আন্তর্জাতিক আর্থিক প্রতিষ্ঠান ও বৈদেশিক ঋণ',
    bg: ['IMF ও বিশ্বব্যাংক ১৯৪৪ সালের ব্রেটন উডস সম্মেলনের ফসল; উভয়ের সদর দপ্তর ওয়াশিংটন ডি.সি.-তে।', 'IMF মূলত লেনদেন ভারসাম্য সহায়তা দেয়, আর বিশ্বব্যাংক ও ADB উন্নয়ন প্রকল্পে অর্থায়ন করে।'],
    imp: ['ঋণের কিস্তি ছাড় সাধারণত রাজস্ব, ভর্তুকি, বিনিময় হার ও ব্যাংক খাত সংস্কারের শর্তের সাথে যুক্ত।', 'এ ধরনের সহায়তা রিজার্ভ ও আন্তর্জাতিক আস্থা বাড়ায়।', 'শর্ত পূরণে ব্যর্থ হলে কিস্তি বিলম্বিত হয়ে অর্থনৈতিক চাপ বাড়তে পারে।'],
    bd: ['বাংলাদেশের কর-জিডিপি অনুপাত দক্ষিণ এশিয়ায় সবচেয়ে কম দেশগুলোর একটি, যা সংস্কারের অন্যতম বিষয়।', 'বৈদেশিক ঋণের সুদ ও কিস্তি পরিশোধের চাপ ক্রমেই বাড়ছে।'],
    rec: ['রাজস্ব আহরণ বাড়াতে কর-জাল সম্প্রসারণ ও অটোমেশন।', 'ঋণের শর্ত জাতীয় স্বার্থ ও সামাজিক সুরক্ষার সাথে সমন্বয় করা।', 'প্রকল্প বাস্তবায়নে স্বচ্ছতা ও দক্ষতা নিশ্চিত করা।'],
    end: 'বৈদেশিক সহায়তা সাময়িক স্বস্তি দেয়, কিন্তু টেকসই সমাধান আসে অভ্যন্তরীণ সংস্কার ও সুশাসন থেকে।' },
  { name: 'International financial institutions and external loans',
    bg: ['The IMF and the World Bank emerged from the 1944 Bretton Woods Conference; both are headquartered in Washington, D.C.', 'The IMF mainly provides balance-of-payments support, while the World Bank and ADB finance development projects.'],
    imp: ['Loan tranches are usually tied to reforms in revenue, subsidies, exchange rates and the banking sector.', 'Such support boosts reserves and international confidence.', 'Failure to meet conditions can delay tranches and increase economic stress.'],
    bd: ['Bangladesh has one of the lowest tax-to-GDP ratios in South Asia, a key reform area.', 'Repayment pressure on external debt is rising.'],
    rec: ['Widen the tax net and automate revenue collection.', 'Align loan conditions with national interest and social protection.', 'Ensure transparency and efficiency in project implementation.'],
    end: 'Foreign assistance gives temporary relief; lasting solutions come from domestic reform and good governance.' }],
 ['economy', /\bbudget\b|বাজেট|\bGDP\b|জিডিপি|revenue|রাজস্ব|\bexports?\b|রপ্তানি|\bimports?\b|আমদানি|tariff|শুল্ক|\bLDC\b|এলডিসি|investment|বিনিয়োগ|economy|অর্থনীতি|garment|পোশাক/i,
  { name: 'দেশের অর্থনীতি ও বাণিজ্য',
    bg: ['বাংলাদেশের অর্থবছর জুলাই থেকে জুন; রপ্তানির সবচেয়ে বড় অংশ আসে তৈরি পোশাক খাত থেকে।', 'বাংলাদেশ স্বল্পোন্নত দেশ (LDC) থেকে উত্তরণের প্রক্রিয়ায় রয়েছে, যা বাণিজ্য সুবিধায় পরিবর্তন আনবে।'],
    imp: ['বিনিয়োগ, কর্মসংস্থান ও প্রবৃদ্ধির ওপর সরাসরি প্রভাব পড়ে।', 'রপ্তানি বহুমুখীকরণ না হলে বাহ্যিক ধাক্কায় অর্থনীতি ঝুঁকিতে পড়ে।', 'শুল্ক ও বাণিজ্যনীতির পরিবর্তন প্রতিযোগিতা সক্ষমতা নির্ধারণ করে।'],
    bd: ['রপ্তানি আয় পোশাক খাতের ওপর অতিনির্ভরশীল।', 'বিদেশি প্রত্যক্ষ বিনিয়োগ (FDI) এখনও প্রত্যাশার তুলনায় কম।'],
    rec: ['রপ্তানি পণ্য ও বাজার বহুমুখীকরণ।', 'ব্যবসা সহজীকরণ, বিদ্যুৎ-জ্বালানি নিশ্চয়তা ও অবকাঠামো উন্নয়ন।', 'অর্থনৈতিক অঞ্চলগুলো দ্রুত কার্যকর করা ও নীতির ধারাবাহিকতা রক্ষা।'],
    end: 'দূরদর্শী নীতি ও কাঠামোগত সংস্কারই বাংলাদেশকে টেকসই উচ্চ প্রবৃদ্ধির পথে রাখতে পারে।' },
  { name: 'Economy and trade',
    bg: ['Bangladesh’s fiscal year runs from July to June; ready-made garments earn the largest share of exports.', 'Bangladesh is graduating from the Least Developed Country (LDC) category, which will change its trade preferences.'],
    imp: ['It directly affects investment, employment and growth.', 'Without export diversification, the economy stays exposed to external shocks.', 'Tariff and trade policy shape competitiveness.'],
    bd: ['Export earnings depend heavily on the garment sector.', 'Foreign direct investment (FDI) remains below potential.'],
    rec: ['Diversify export products and markets.', 'Improve ease of doing business, energy supply and infrastructure.', 'Operationalise economic zones and keep policies consistent.'],
    end: 'Far-sighted policy and structural reform can keep Bangladesh on a path of sustained high growth.' }],
 ['state', /election|নির্বাচন|referendum|গণভোট|parliament|সংসদ|constitution|সংবিধান|reform|সংস্কার|জুলাই সনদ|July Charter|interim|অন্তর্বর্তী/i,
  { name: 'রাষ্ট্র সংস্কার, নির্বাচন ও গণতন্ত্র',
    bg: ['বাংলাদেশের জাতীয় সংসদ এককক্ষবিশিষ্ট; মোট আসন ৩৫০ (৩০০ সাধারণ ও ৫০ সংরক্ষিত নারী আসন)।', 'নির্বাচন কমিশন একটি সাংবিধানিক প্রতিষ্ঠান।'],
    imp: ['অংশগ্রহণমূলক ও বিশ্বাসযোগ্য নির্বাচন রাজনৈতিক স্থিতিশীলতা ও আন্তর্জাতিক আস্থা বাড়ায়।', 'প্রাতিষ্ঠানিক সংস্কার জবাবদিহি ও ক্ষমতার ভারসাম্য নিশ্চিত করে।', 'রাজনৈতিক অনিশ্চয়তা বিনিয়োগ ও অর্থনীতিতে নেতিবাচক প্রভাব ফেলে।'],
    bd: ['রাজনৈতিক দলগুলোর মধ্যে ঐকমত্য গড়ে তোলাই সংস্কার বাস্তবায়নের মূল চাবিকাঠি।'],
    rec: ['স্বাধীন ও শক্তিশালী নির্বাচন কমিশন।', 'সংস্কার প্রস্তাব বাস্তবায়নে সর্বদলীয় ঐকমত্য ও স্বচ্ছ রোডম্যাপ।', 'গণমাধ্যম ও নাগরিক সমাজের স্বাধীনতা নিশ্চিত করা।'],
    end: 'টেকসই গণতন্ত্রের জন্য শক্তিশালী প্রতিষ্ঠান ও রাজনৈতিক সহনশীলতা অপরিহার্য।' },
  { name: 'State reform, elections and democracy',
    bg: ['Bangladesh has a unicameral parliament with 350 seats (300 general and 50 reserved for women).', 'The Election Commission is a constitutional body.'],
    imp: ['Inclusive and credible elections strengthen political stability and international confidence.', 'Institutional reform ensures accountability and checks and balances.', 'Political uncertainty hurts investment and the economy.'],
    bd: ['Building consensus among political parties is the key to implementing reforms.'],
    rec: ['An independent and strong Election Commission.', 'An all-party consensus and a transparent roadmap for reforms.', 'Guaranteed freedom of the press and civil society.'],
    end: 'Strong institutions and political tolerance are essential for sustainable democracy.' }],
 ['rohingya', /Rohingya|রোহিঙ্গা|Myanmar|মিয়ানমার|Rakhine|রাখাইন/i,
  { name: 'রোহিঙ্গা সংকট',
    bg: ['২০১৭ সালের আগস্ট থেকে মিয়ানমারের রাখাইন রাজ্য থেকে বিপুলসংখ্যক রোহিঙ্গা বাংলাদেশে আশ্রয় নেয়।', 'গাম্বিয়া আন্তর্জাতিক বিচার আদালতে (ICJ) মিয়ানমারের বিরুদ্ধে গণহত্যা মামলা করে।'],
    imp: ['কক্সবাজার অঞ্চলের পরিবেশ, অর্থনীতি ও নিরাপত্তায় চাপ সৃষ্টি হয়।', 'আন্তর্জাতিক সহায়তা কমলে মানবিক সংকট আরও গভীর হয়।', 'প্রত্যাবাসন না হলে আঞ্চলিক নিরাপত্তা ঝুঁকিতে পড়ে।'],
    bd: ['বাংলাদেশ মানবিক কারণে আশ্রয় দিলেও টেকসই সমাধান হিসেবে নিরাপদ ও মর্যাদাপূর্ণ প্রত্যাবাসন চায়।'],
    rec: ['মিয়ানমারের ওপর আন্তর্জাতিক কূটনৈতিক চাপ বাড়ানো।', 'স্বেচ্ছা, নিরাপদ ও মর্যাদাপূর্ণ প্রত্যাবাসনের নিশ্চয়তা।', 'মানবিক সহায়তায় দাতাদেশগুলোর প্রতিশ্রুতি বজায় রাখা।'],
    end: 'রোহিঙ্গা সংকটের স্থায়ী সমাধান মিয়ানমারেই নিহিত; বিশ্বসম্প্রদায়কে এর দায় নিতে হবে।' },
  { name: 'The Rohingya crisis',
    bg: ['Since August 2017, a large number of Rohingya have fled Myanmar’s Rakhine State to Bangladesh.', 'The Gambia filed a genocide case against Myanmar at the International Court of Justice (ICJ).'],
    imp: ['It puts pressure on the environment, economy and security of the Cox’s Bazar region.', 'Falling international aid deepens the humanitarian crisis.', 'Without repatriation, regional security is at risk.'],
    bd: ['Bangladesh sheltered the Rohingya on humanitarian grounds but seeks safe and dignified repatriation as the lasting solution.'],
    rec: ['Increase international diplomatic pressure on Myanmar.', 'Guarantee voluntary, safe and dignified repatriation.', 'Donors must sustain humanitarian funding.'],
    end: 'The permanent solution lies in Myanmar; the international community must share the responsibility.' }],
 ['conflict', /Gaza|গাজা|Israel|ইসরায়েল|Palestin|ফিলিস্তিন|Ukraine|ইউক্রেন|Russia|রাশিয়া|\bIran\b|ইরান|Yemen|ইয়েমেন|Sudan|সুদান|war\b|যুদ্ধ|ceasefire|যুদ্ধবিরতি/i,
  { name: 'বৈশ্বিক সংঘাত ও মানবিক সংকট',
    bg: ['চলমান আন্তর্জাতিক সংঘাতগুলো বিশ্বব্যাপী জ্বালানি, খাদ্য ও সরবরাহ ব্যবস্থায় অস্থিরতা তৈরি করছে।', 'আন্তর্জাতিক মানবিক আইন (জেনেভা কনভেনশন) যুদ্ধে বেসামরিক নাগরিকদের সুরক্ষা নিশ্চিত করতে বাধ্য করে।'],
    imp: ['বেসামরিক প্রাণহানি, বাস্তুচ্যুতি ও দুর্ভিক্ষের ঝুঁকি বাড়ে।', 'জ্বালানি ও খাদ্যপণ্যের দাম বেড়ে বিশ্ব অর্থনীতিতে মূল্যস্ফীতি সৃষ্টি হয়।', 'জাতিসংঘ ও আন্তর্জাতিক আইনের কার্যকারিতা প্রশ্নের মুখে পড়ে।'],
    bd: ['আমদানিনির্ভর জ্বালানি ও খাদ্যপণ্যের দাম বাড়লে বাংলাদেশের মূল্যস্ফীতি ও রিজার্ভে চাপ পড়ে।', 'মধ্যপ্রাচ্যে কর্মরত প্রবাসী ও রেমিট্যান্স প্রবাহ প্রভাবিত হতে পারে।'],
    rec: ['স্থায়ী যুদ্ধবিরতি ও কূটনৈতিক সমাধানে আন্তর্জাতিক উদ্যোগ।', 'মানবিক সহায়তার নির্বিঘ্ন প্রবেশাধিকার।', 'বাংলাদেশের জ্বালানি ও খাদ্য আমদানির উৎস বহুমুখীকরণ।'],
    end: 'শান্তি ও আন্তর্জাতিক আইনের প্রতি শ্রদ্ধাই বিশ্বকে মানবিক বিপর্যয় থেকে রক্ষা করতে পারে।' },
  { name: 'Global conflicts and humanitarian crises',
    bg: ['Ongoing conflicts are destabilising global energy, food and supply chains.', 'International humanitarian law (the Geneva Conventions) requires the protection of civilians in war.'],
    imp: ['Civilian deaths, displacement and famine risks rise.', 'Higher energy and food prices fuel global inflation.', 'The credibility of the UN and international law is questioned.'],
    bd: ['Higher prices of imported fuel and food raise inflation and strain reserves in Bangladesh.', 'Migrant workers and remittances, especially from the Middle East, may be affected.'],
    rec: ['International efforts for a lasting ceasefire and diplomatic solution.', 'Unhindered humanitarian access.', 'Diversify Bangladesh’s sources of fuel and food imports.'],
    end: 'Only peace and respect for international law can protect the world from humanitarian catastrophe.' }],
 ['tech', /\bAI\b|artificial intelligence|কৃত্রিম বুদ্ধিমত্তা|এআই|semiconductor|\bchips?\b|চিপ|cyber|সাইবার|satellite|স্যাটেলাইট|digital|ডিজিটাল|NVIDIA|এনভিডিয়া/i,
  { name: 'প্রযুক্তি ও কৃত্রিম বুদ্ধিমত্তা',
    bg: ['কৃত্রিম বুদ্ধিমত্তা (AI) ও সেমিকন্ডাক্টর এখন বৈশ্বিক অর্থনীতি ও ভূরাজনীতির কেন্দ্রবিন্দু।', 'চিপ উৎপাদন ও প্রযুক্তি রপ্তানি নিয়ন্ত্রণ নিয়ে বড় শক্তিগুলোর প্রতিযোগিতা চলছে।'],
    imp: ['উৎপাদনশীলতা বাড়লেও কর্মসংস্থানের ধরন বদলে যায়।', 'তথ্য নিরাপত্তা, গোপনীয়তা ও নৈতিকতার প্রশ্ন সামনে আসে।', 'প্রযুক্তি সরবরাহ শৃঙ্খলে ভূরাজনৈতিক উত্তেজনা প্রভাব ফেলে।'],
    bd: ['বাংলাদেশের তরুণ জনগোষ্ঠী ও আইটি ফ্রিল্যান্সিং খাত AI-এর সুযোগ কাজে লাগাতে পারে।', 'সাইবার নিরাপত্তা ও ডেটা সুরক্ষা আইন হালনাগাদ করা জরুরি।'],
    rec: ['শিক্ষা কারিকুলামে AI ও ডিজিটাল দক্ষতা অন্তর্ভুক্ত করা।', 'দায়িত্বশীল AI নীতিমালা ও ডেটা সুরক্ষা কাঠামো প্রণয়ন।', 'সেমিকন্ডাক্টর ও হাই-টেক খাতে বিনিয়োগ আকর্ষণ।'],
    end: 'প্রযুক্তিকে মানবকল্যাণে ব্যবহার করতে পারলে বাংলাদেশ চতুর্থ শিল্পবিপ্লবের সুফল ঘরে তুলতে পারবে।' },
  { name: 'Technology and artificial intelligence',
    bg: ['Artificial intelligence and semiconductors are now central to the global economy and geopolitics.', 'Major powers compete over chip production and technology export controls.'],
    imp: ['Productivity rises but the nature of jobs changes.', 'Questions of data security, privacy and ethics come to the fore.', 'Geopolitical tension disrupts technology supply chains.'],
    bd: ['Bangladesh’s young population and IT freelancing sector can benefit from AI.', 'Cyber-security and data-protection laws need updating.'],
    rec: ['Include AI and digital skills in the curriculum.', 'Adopt a responsible-AI policy and data-protection framework.', 'Attract investment in semiconductors and high-tech industries.'],
    end: 'If technology serves human welfare, Bangladesh can reap the benefits of the Fourth Industrial Revolution.' }],
 ['health', /antibiotic|অ্যান্টিবায়োটিক|pandemic|মহামারি|vaccine|টিকা|dengue|ডেঙ্গু|outbreak|প্রাদুর্ভাব|\bWHO\b|health|স্বাস্থ্য/i,
  { name: 'জনস্বাস্থ্য',
    bg: ['অ্যান্টিবায়োটিকের অপব্যবহারে জীবাণু ওষুধ-প্রতিরোধী হয়ে ওঠে — একে অ্যান্টিমাইক্রোবিয়াল রেজিস্ট্যান্স (AMR) বলে।', 'বিশ্ব স্বাস্থ্য সংস্থা (WHO, সদর দপ্তর জেনেভা) বৈশ্বিক স্বাস্থ্য নীতির নেতৃত্ব দেয়।'],
    imp: ['সাধারণ সংক্রমণও প্রাণঘাতী হয়ে উঠতে পারে।', 'চিকিৎসা ব্যয় ও হাসপাতালে থাকার সময় বাড়ে।', 'স্বাস্থ্য ব্যবস্থা ও অর্থনীতির ওপর চাপ সৃষ্টি হয়।'],
    bd: ['প্রেসক্রিপশন ছাড়া অ্যান্টিবায়োটিক বিক্রি এবং মৌসুমি ডেঙ্গু বাংলাদেশের জনস্বাস্থ্যের বড় ঝুঁকি।'],
    rec: ['প্রেসক্রিপশন ছাড়া অ্যান্টিবায়োটিক বিক্রি কঠোরভাবে বন্ধ করা।', 'জনসচেতনতা ও রোগ নজরদারি ব্যবস্থা জোরদার।', 'স্বাস্থ্য খাতে বাজেট বরাদ্দ ও গবেষণা বৃদ্ধি।'],
    end: 'সচেতনতা ও সুশাসনই জনস্বাস্থ্য সুরক্ষার সবচেয়ে কার্যকর হাতিয়ার।' },
  { name: 'Public health',
    bg: ['Misuse of antibiotics makes germs drug-resistant, known as antimicrobial resistance (AMR).', 'The World Health Organization (WHO, Geneva) leads global health policy.'],
    imp: ['Common infections can become deadly.', 'Treatment costs and hospital stays increase.', 'Health systems and the economy come under pressure.'],
    bd: ['Over-the-counter antibiotic sales and seasonal dengue are major public-health risks in Bangladesh.'],
    rec: ['Strictly stop antibiotic sales without prescription.', 'Strengthen public awareness and disease surveillance.', 'Increase health budgets and research.'],
    end: 'Awareness and good governance are the most effective tools to protect public health.' }],
 ['energy', /Padma Bridge|পদ্মা সেতু|\bmetro\b|মেট্রো|\bports?\b|বন্দর|Matarbari|মাতারবাড়ী|nuclear|পারমাণবিক|Rooppur|রূপপুর|power|বিদ্যুৎ|\bLNG\b|এলএনজি|gas|গ্যাস|energy|জ্বালানি|Teesta|তিস্তা/i,
  { name: 'জ্বালানি নিরাপত্তা ও অবকাঠামো',
    bg: ['জ্বালানি নিরাপত্তা অর্থনৈতিক প্রবৃদ্ধি ও শিল্পোৎপাদনের পূর্বশর্ত।', 'বাংলাদেশ আমদানিকৃত এলএনজি ও জ্বালানি তেলের ওপর ক্রমেই নির্ভরশীল হচ্ছে।'],
    imp: ['বিদ্যুৎ ও গ্যাস সংকটে শিল্পোৎপাদন ও রপ্তানি ব্যাহত হয়।', 'আমদানি ব্যয় বাড়লে রিজার্ভে চাপ পড়ে।', 'মেগাপ্রকল্প যোগাযোগ ও বাণিজ্য খরচ কমায়।'],
    bd: ['নিজস্ব গ্যাস অনুসন্ধান কম হওয়া এবং ক্যাপাসিটি চার্জ বিদ্যুৎ খাতের আলোচিত সমস্যা।'],
    rec: ['স্থলভাগ ও সমুদ্রে নিজস্ব গ্যাস অনুসন্ধান জোরদার।', 'নবায়নযোগ্য জ্বালানির অংশ বাড়ানো।', 'প্রকল্প ব্যয় ও সময় নিয়ন্ত্রণে স্বচ্ছতা নিশ্চিত করা।'],
    end: 'সাশ্রয়ী ও নিরবচ্ছিন্ন জ্বালানিই শিল্পায়ন ও উন্নয়নের চালিকাশক্তি।' },
  { name: 'Energy security and infrastructure',
    bg: ['Energy security is a precondition for economic growth and industrial output.', 'Bangladesh is increasingly dependent on imported LNG and fuel oil.'],
    imp: ['Power and gas shortages disrupt industry and exports.', 'Higher import bills strain reserves.', 'Mega-projects cut transport and trade costs.'],
    bd: ['Limited domestic gas exploration and capacity charges are widely discussed problems in the power sector.'],
    rec: ['Step up onshore and offshore gas exploration.', 'Raise the share of renewable energy.', 'Ensure transparency in project cost and time.'],
    end: 'Affordable and uninterrupted energy drives industrialisation and development.' }],
 ['disaster', /flood|বন্যা|cyclone|ঘূর্ণিঝড়|earthquake|ভূমিকম্প|disaster|দুর্যোগ|landslide|ভূমিধস/i,
  { name: 'প্রাকৃতিক দুর্যোগ ব্যবস্থাপনা',
    bg: ['ভৌগোলিক অবস্থানের কারণে বাংলাদেশ বন্যা, ঘূর্ণিঝড় ও ভূমিকম্পের ঝুঁকিতে রয়েছে।'],
    imp: ['প্রাণহানি, ফসল ও অবকাঠামোর ক্ষতি হয়।', 'দরিদ্র জনগোষ্ঠী সবচেয়ে বেশি ক্ষতিগ্রস্ত হয়।'],
    bd: ['ঘূর্ণিঝড় প্রস্তুতি কর্মসূচি (CPP) ও আশ্রয়কেন্দ্রের কারণে বাংলাদেশ দুর্যোগে প্রাণহানি কমাতে সফল।'],
    rec: ['আগাম সতর্কতা ব্যবস্থা আধুনিকায়ন।', 'ভূমিকম্প সহনশীল ভবন নির্মাণে বিল্ডিং কোড কঠোরভাবে প্রয়োগ।', 'দুর্যোগ-পরবর্তী পুনর্বাসনে দ্রুত সহায়তা।'],
    end: 'প্রস্তুতিই দুর্যোগের ক্ষতি কমানোর সবচেয়ে কার্যকর উপায়।' },
  { name: 'Disaster management',
    bg: ['Due to its geography, Bangladesh is exposed to floods, cyclones and earthquakes.'],
    imp: ['Loss of life, crops and infrastructure.', 'The poor are hit hardest.'],
    bd: ['Thanks to the Cyclone Preparedness Programme (CPP) and shelters, Bangladesh has greatly reduced disaster deaths.'],
    rec: ['Modernise early-warning systems.', 'Strictly enforce the building code for earthquake safety.', 'Provide quick post-disaster rehabilitation.'],
    end: 'Preparedness is the most effective way to reduce disaster losses.' }],
 ['intl', /\bUN\b|United Nations|জাতিসংঘ|Security Council|নিরাপত্তা পরিষদ|summit|শীর্ষ সম্মেলন|\bG20\b|\bG7\b|BRICS|ব্রিকস|ASEAN|SAARC|BIMSTEC|\bEU\b|NATO|Trump|ট্রাম্প|\bXi\b|শি জিনপিং|diplomatic|কূটনৈতিক/i,
  { name: 'আন্তর্জাতিক সম্পর্ক ও কূটনীতি',
    bg: ['বহুপাক্ষিক সংস্থা ও শীর্ষ সম্মেলনগুলো বৈশ্বিক নিরাপত্তা, বাণিজ্য ও উন্নয়ন এজেন্ডা নির্ধারণ করে।', 'জাতিসংঘের সদস্য ১৯৩টি দেশ; নিরাপত্তা পরিষদে ৫টি স্থায়ী সদস্যের ভেটো ক্ষমতা রয়েছে।'],
    imp: ['বড় শক্তিগুলোর সিদ্ধান্ত বিশ্ববাণিজ্য, জ্বালানির দাম ও নিরাপত্তায় প্রভাব ফেলে।', 'আঞ্চলিক জোট ও অংশীদারত্বের নতুন সমীকরণ তৈরি হয়।'],
    bd: ['বাংলাদেশের পররাষ্ট্রনীতির মূলনীতি “সকলের সাথে বন্ধুত্ব, কারো সাথে বৈরিতা নয়”।', 'বাংলাদেশ জাতিসংঘ শান্তিরক্ষা মিশনে শীর্ষ সেনা প্রেরণকারী দেশগুলোর একটি।'],
    rec: ['ভারসাম্যপূর্ণ ও স্বার্থভিত্তিক কূটনীতি অনুসরণ।', 'আঞ্চলিক সংযোগ ও বাণিজ্য চুক্তিতে সক্রিয় অংশগ্রহণ।', 'বহুপাক্ষিক ফোরামে জলবায়ু ও রোহিঙ্গা ইস্যু জোরালোভাবে তুলে ধরা।'],
    end: 'পরিবর্তনশীল বিশ্বব্যবস্থায় দূরদর্শী কূটনীতিই বাংলাদেশের জাতীয় স্বার্থ রক্ষার হাতিয়ার।' },
  { name: 'International relations and diplomacy',
    bg: ['Multilateral bodies and summits shape the global security, trade and development agenda.', 'The UN has 193 member states; the five permanent members of the Security Council hold veto power.'],
    imp: ['Decisions of major powers affect world trade, energy prices and security.', 'New equations of regional alliances emerge.'],
    bd: ['Bangladesh’s foreign policy principle is “Friendship to all, malice towards none”.', 'Bangladesh is one of the top troop contributors to UN peacekeeping.'],
    rec: ['Pursue balanced, interest-based diplomacy.', 'Participate actively in regional connectivity and trade agreements.', 'Raise climate and Rohingya issues strongly in multilateral forums.'],
    end: 'In a changing world order, far-sighted diplomacy is the key to protecting national interest.' }],
 ['sports', /cricket|ক্রিকেট|football|ফুটবল|World Cup|বিশ্বকাপ|Olympic|অলিম্পিক|ICC|FIFA/i,
  { name: 'খেলাধুলা', bg: ['খেলাধুলা জাতীয় ভাবমূর্তি ও তরুণদের অনুপ্রেরণার বড় উৎস।'], imp: ['আন্তর্জাতিক সাফল্য দেশের ব্র্যান্ডিং বাড়ায়।'], bd: ['ক্রিকেট বাংলাদেশের সবচেয়ে জনপ্রিয় খেলা; বাংলাদেশ ICC-র পূর্ণ সদস্য (২০০০ সাল থেকে টেস্ট মর্যাদা)।'], rec: ['তৃণমূল পর্যায়ে প্রতিভা অন্বেষণ ও অবকাঠামো উন্নয়ন।'], end: 'পরিকল্পিত বিনিয়োগে খেলাধুলায় বাংলাদেশ আরও সাফল্য পেতে পারে।' },
  { name: 'Sports', bg: ['Sports shape national image and inspire youth.'], imp: ['International success boosts the country’s brand.'], bd: ['Cricket is the most popular sport; Bangladesh received Test status in 2000.'], rec: ['Talent hunts and infrastructure at the grassroots.'], end: 'With planned investment, Bangladesh can achieve more in sports.' }],
];
const GENERAL = ['general', /./,
  { name: 'সাম্প্রতিক গুরুত্বপূর্ণ ঘটনা', bg: ['বিষয়টি সাম্প্রতিক সময়ে দেশ-বিদেশের গণমাধ্যমে গুরুত্বের সাথে প্রকাশিত হয়েছে।'], imp: ['ঘটনাটি সংশ্লিষ্ট খাত ও জনজীবনে প্রভাব ফেলতে পারে।', 'নীতিনির্ধারণে বিষয়টি বিবেচনায় আসবে।'], bd: ['বাংলাদেশের প্রেক্ষাপটে বিষয়টি থেকে নীতি-শিক্ষা নেওয়ার সুযোগ রয়েছে।'], rec: ['সংশ্লিষ্ট কর্তৃপক্ষের সময়োপযোগী ও স্বচ্ছ পদক্ষেপ।', 'অংশীজনদের মধ্যে সমন্বয় বৃদ্ধি।'], end: 'ঘটনাটির ধারাবাহিক পর্যবেক্ষণ ও যথাযথ পদক্ষেপ গ্রহণ জরুরি।' },
  { name: 'A significant recent development', bg: ['The issue has been widely reported in national and international media.'], imp: ['It may affect the related sector and public life.', 'It will feed into policy-making.'], bd: ['There are policy lessons for Bangladesh.'], rec: ['Timely and transparent action by authorities.', 'Better coordination among stakeholders.'], end: 'Close monitoring and appropriate action are essential.' }];

function topicOf(text) { return TOPICS.find((t) => t[1].test(text)) || GENERAL; }
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// item: news item; x: {tbn, dbn, cover, why} from insight; facts: {nums, names}; day: formatted date
function answer(item, x = {}, facts = { nums: [], names: [] }, day = '', lang = 'bn') {
  const text = `${item.t} ${item.d || ''} ${x.tbn || ''}`;
  const tp = topicOf(text), L = lang === 'bn' ? tp[2] : tp[3];
  const V = window.TISG?.vocabify || esc;
  const titleBn = x.tbn || item.t, descBn = x.dbn || item.d || '';
  const qTitle = /[?？]\s*$|^(why|how|what|who|when|where|is|are|can|will)\b|:/i.test(item.t);
  const leadBn = (qTitle && descBn ? descBn : titleBn).replace(/[।.!?…]+$/, '');
  const leadEn = (qTitle && item.d ? item.d : item.t).replace(/[.!?…]+$/, '');
  const bullets = (a) => `<ul>${a.map((s) => `<li>${s}</li>`).join('')}</ul>`;
  if (lang === 'bn') {
    const keyFacts = [
      `<b>ঘটনা:</b> ${esc(titleBn)}`,
      descBn ? `<b>বিস্তারিত:</b> ${esc(descBn)}` : '',
      facts.nums.length ? `<b>গুরুত্বপূর্ণ পরিসংখ্যান:</b> ${facts.nums.map(esc).join(' • ')}` : '',
      facts.names.length ? `<b>সংশ্লিষ্ট নাম/প্রতিষ্ঠান:</b> ${facts.names.map(esc).join(', ')}` : '',
      `<b>তথ্যসূত্র:</b> ${esc(item.sn)}, ${day}${x.cover > 1 ? ` (মোট ${x.cover}টি সংবাদমাধ্যমে প্রকাশিত)` : ''}`,
    ].filter(Boolean);
    return `<div class="ans">
      <h4 class="ans-h">${esc(L.name)}: ${esc(titleBn.replace(/[।.!?]$/, ''))}</h4>
      <p><b>১. ভূমিকা:</b> ${day} তারিখে ${esc(item.sn)}-এ প্রকাশিত প্রতিবেদন অনুযায়ী, ${esc(leadBn)}। ${L.bg[0]}</p>
      <p><b>২. পটভূমি:</b></p>${bullets(L.bg)}
      <p><b>৩. মূল তথ্য:</b></p>${bullets(keyFacts)}
      <p><b>৪. গুরুত্ব ও প্রভাব:</b></p>${bullets(L.imp)}
      <p><b>৫. বাংলাদেশের প্রেক্ষাপট:</b></p>${bullets(L.bd)}
      <p><b>৬. সুপারিশ / করণীয়:</b></p>${bullets(L.rec)}
      <p><b>৭. উপসংহার:</b> ${L.end}</p>
    </div>`;
  }
  const keyFacts = [
    `<b>Event:</b> ${V(item.t)}`, item.d ? `<b>Details:</b> ${V(item.d)}` : '',
    facts.nums.length ? `<b>Key figures:</b> ${facts.nums.map(esc).join(' • ')}` : '',
    facts.names.length ? `<b>Names involved:</b> ${facts.names.map(esc).join(', ')}` : '',
    `<b>Source:</b> ${esc(item.sn)}${x.cover > 1 ? ` (reported by ${x.cover} outlets)` : ''}`,
  ].filter(Boolean);
  return `<div class="ans en">
    <h4 class="ans-h">${esc(L.name)}: ${V(item.t)}</h4>
    <p><b>1. Introduction:</b> According to a report published by ${esc(item.sn)}, ${V(leadEn.charAt(0).toLowerCase() + leadEn.slice(1))}. ${L.bg[0]}</p>
    <p><b>2. Background:</b></p>${bullets(L.bg)}
    <p><b>3. Key facts:</b></p>${bullets(keyFacts)}
    <p><b>4. Significance and impact:</b></p>${bullets(L.imp)}
    <p><b>5. Bangladesh perspective:</b></p>${bullets(L.bd)}
    <p><b>6. Recommendations / Way forward:</b></p>${bullets(L.rec)}
    <p><b>7. Conclusion:</b> ${L.end}</p>
  </div>`;
}
const TIPS = `<div class="box exam tips"><h4>💯 ফুল মার্কস পাওয়ার কৌশল</h4><ul>
  <li><b>শিরোনাম</b> আকর্ষণীয় করুন ও আন্ডারলাইন দিন; প্রতিটি অংশে <b>সাবহেডিং</b> (ভূমিকা → পটভূমি → মূল তথ্য → প্রভাব → বাংলাদেশ → সুপারিশ → উপসংহার)।</li>
  <li><b>সংখ্যা, তারিখ, প্রতিষ্ঠানের নাম</b> অবশ্যই লিখুন — পরীক্ষক এগুলো খোঁজেন। গুরুত্বপূর্ণ তথ্য বক্স বা বুলেটে দিন।</li>
  <li><b>তথ্যসূত্র</b> উল্লেখ করুন (যেমন: “প্রথম আলো, ২৩ নভেম্বর ২০২৬”) — নির্ভরযোগ্যতা বাড়ে।</li>
  <li>প্রাসঙ্গিক হলে একটি <b>ছোট ছক/চিত্র</b> (টেবিল, ফ্লোচার্ট) দিন।</li>
  <li><b>বাংলাদেশের প্রেক্ষাপট ও সুপারিশ</b> অংশ বাদ দেবেন না — এখানেই বিশ্লেষণ ক্ষমতা যাচাই হয়।</li>
  <li>সময় ভাগ: ১০ নম্বরের প্রশ্নে ~১২–১৫ মিনিট, ২৫০–৩৫০ শব্দ। হাতের লেখা পরিষ্কার, মার্জিন সমান রাখুন।</li>
</ul></div>`;
window.TISX = { answer, topicOf, TIPS };
})();
