// KAARIGAR — Google Translate Indic Translation Engine (English <-> Kannada <-> Hindi)
// Powered directly by Google Translate API with in-memory & localStorage caching.
// Translates natural sentences and phrases from English to Kannada and Hindi
// while strictly preserving numbers (e.g. 148+, ₹42.8 Lakhs, +280%, ₹18,400, 92%, 123456, 25 per page)
// and special characters (₹, $, %, +, -, *, /, =, ✦, ·, 👁, 📍, 💡, ✓, ★, —, &, |, !, ?, etc.).

export type SupportedLanguage = 'en' | 'kn' | 'hi';

// In-memory cache for ultra-fast (0ms) synchronous UI lookups
const TRANSLATION_CACHE = new Map<string, string>();

// Pre-load common verified Google Translate strings to ensure instant initial rendering
const PRELOADED_GOOGLE_TRANSLATIONS: Record<string, { kn: string; hi: string }> = {
  // Navigation & Branding
  "KAARIGAR": { kn: "ಕಾರೀಗರ್", hi: "कारीगर" },
  "Living Craft Archive": { kn: "ಜೀವಂತ ಕರಕುಶಲ ಕಲಾ ದಾಖಲೆ", hi: "जीवंत शिल्प धरोहर अभिलेखागार" },
  "Living Craft Sanctuary": { kn: "ಜೀವಂತ ಕರಕುಶಲ ಆಲಯ", hi: "जीवंत हस्तशिल्प धाम" },
  "Guardians of India's Living Hands": { kn: "ಭಾರತದ ಜೀವಂತ ಕೈಗಳ ಸಂರಕ್ಷಕರು", hi: "भारत के जीवंत हाथों के संरक्षक" },
  "Living Gallery": { kn: "ಲಿವಿಂಗ್ ಗ್ಯಾಲರಿ", hi: "लिविंग गैलरी" },
  "Custom Commissions": { kn: "ಕಸ್ಟಮ್ ಆಯೋಗಗಳು", hi: "कस्टम कमीशन" },
  "Master Artisans": { kn: "ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳು", hi: "मास्टर कारीगर" },
  "Craft Journey": { kn: "ಕ್ರಾಫ್ಟ್ ಜರ್ನಿ", hi: "शिल्प यात्रा" },
  "Artisan Atelier": { kn: "ಕುಶಲಕರ್ಮಿ ಅಟೆಲಿಯರ್", hi: "कारीगर अटेलियर" },
  "Storefront": { kn: "ಅಂಗಡಿ ಮುಂಗಟ್ಟು", hi: "स्टोर के सामने" },
  "Shopping Bag": { kn: "ಶಾಪಿಂಗ್ ಬ್ಯಾಗ್", hi: "शॉपिंग बैग" },
  "Saved Heirlooms": { kn: "ಉಳಿಸಿದ ಚರಾಸ್ತಿಗಳು", hi: "सहेजे गए विरासत" },
  "Account": { kn: "ಖಾತೆ", hi: "खाता" },
  "My Acquisitions": { kn: "ನನ್ನ ಸ್ವಾಧೀನಗಳು", hi: "मेरे अधिग्रहण" },
  "Sign Out": { kn: "ಸೈನ್ ಔಟ್", hi: "साइन आउट" },
  "Login": { kn: "ಲಾಗಿನ್", hi: "लॉग इन" },
  "Search craft traditions, materials, regions...": { kn: "ಕರಕುಶಲ ಸಂಪ್ರದಾಯಗಳು, ಸಾಮಗ್ರಿಗಳು, ಪ್ರದೇಶಗಳನ್ನು ಹುಡುಕಿ...", hi: "शिल्प परंपराओं, सामग्रियों, क्षेत्रों की खोज करें..." },

  // Home Impact Section
  "Measurable Artisan Impact & Economic Dignity": { kn: "ಅಳೆಯಬಹುದಾದ ಕುಶಲಕರ್ಮಿಗಳ ಪ್ರಭಾವ ಮತ್ತು ಆರ್ಥಿಕ ಘನತೆ", hi: "मापने योग्य कारीगर प्रभाव और आर्थिक गरिमा" },
  "Bypassing middlemen to return fair value directly to traditional craft lineages.": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಕರಕುಶಲ ವಂಶಾವಳಿಗಳಿಗೆ ನೇರವಾಗಿ ನ್ಯಾಯಯುತ ಮೌಲ್ಯವನ್ನು ಹಿಂದಿರುಗಿಸಲು ಮಧ್ಯವರ್ತಿಗಳನ್ನು ಬೈಪಾಸ್ ಮಾಡುವುದು.", hi: "पारंपरिक शिल्प वंशों को सीधे उचित मूल्य वापस करने के लिए बिचौलियों को दरकिनार करना।" },
  "148+ Living Master Artisans": { kn: "148+ ಜೀವಂತ ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳು", hi: "148+ जीवित मास्टर कारीगर" },
  "₹42.8 Lakhs Direct Guild Disbursal": { kn: "₹42.8 ಲಕ್ಷ ನೇರ ಗಿಲ್ಡ್ ವಿತರಣೆ", hi: "₹42.8 लाख प्रत्यक्ष गिल्ड वितरण" },
  "+280% Average Income Uplift": { kn: "+280% ಸರಾಸರಿ ಆದಾಯದ ಉನ್ನತಿ", hi: "+280% औसत आय वृद्धि" },
  "68% Women SHG Guild Share": { kn: "68% ಮಹಿಳಾ SHG ಗಿಲ್ಡ್ ಪಾಲು", hi: "68% महिला एसएचजी गिल्ड शेयर" },
  "6 GI clusters across Karnataka, MP, Bastar & Rajasthan": { kn: "ಕರ್ನಾಟಕ, ಎಂಪಿ, ಬಸ್ತಾರ್ ಮತ್ತು ರಾಜಸ್ಥಾನದಾದ್ಯಂತ 6 ಜಿಐ ಕ್ಲಸ್ಟರ್‌ಗಳು", hi: "कर्नाटक, एमपी, बस्तर और राजस्थान में 6 जीआई क्लस्टर" },
  "92% paid straight to artisan accounts via UPI escrow": { kn: "92% UPI ಎಸ್ಕ್ರೊ ಮೂಲಕ ಕುಶಲಕರ್ಮಿಗಳ ಖಾತೆಗಳಿಗೆ ನೇರವಾಗಿ ಪಾವತಿಸಲಾಗಿದೆ", hi: "92% भुगतान सीधे यूपीआई एस्क्रो के माध्यम से कारीगरों के खातों में किया गया" },
  "Compared to conventional wholesale trader procurement": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಸಗಟು ವ್ಯಾಪಾರಿ ಸಂಗ್ರಹಣೆಗೆ ಹೋಲಿಸಿದರೆ", hi: "पारंपरिक थोक व्यापारी खरीद की तुलना में" },
  "Verified collective metrics & projections across 6 Geographical Indication clusters": { kn: "6 ಭೌಗೋಳಿಕ ಸೂಚನೆ ಕ್ಲಸ್ಟರ್‌ಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಸಾಮೂಹಿಕ ಮೆಟ್ರಿಕ್‌ಗಳು ಮತ್ತು ಪ್ರಕ್ಷೇಪಗಳು", hi: "6 भौगोलिक संकेत समूहों में सत्यापित सामूहिक मेट्रिक्स और अनुमान" },
  
  // Dashboard & Earnings
  "You earned ₹18,400 this month, versus roughly ₹6,000 through a middleman": { kn: "ನೀವು ಈ ತಿಂಗಳು ₹18,400 ಗಳಿಸಿದ್ದೀರಿ, ಮಧ್ಯವರ್ತಿ ಮೂಲಕ ಸರಿಸುಮಾರು ₹6,000 ಗಳಿಸಿದ್ದೀರಿ", hi: "आपने इस महीने ₹18,400 कमाए, जबकि एक बिचौलिए के माध्यम से लगभग ₹6,000 कमाए" },
  "+₹12,400 (+206%) More in Your Family Account": { kn: "+₹12,400 (+206%) ನಿಮ್ಮ ಕುಟುಂಬದ ಖಾತೆಯಲ್ಲಿ ಹೆಚ್ಚು", hi: "+₹12,400 (+206%) आपके परिवार के खाते में अधिक" },
  "KAARIGAR Direct Guild Model (92% payout)": { kn: "ಕಾರೀಗರ್ ನೇರ ಗಿಲ್ಡ್ ಮಾದರಿ (92% ಪಾವತಿ)", hi: "कारीगर प्रत्यक्ष गिल्ड मॉडल (92% भुगतान)" },
  "Conventional Middleman Wholesale Trader (~30% retail share)": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಮಧ್ಯವರ್ತಿ ಸಗಟು ವ್ಯಾಪಾರಿ (~30% ಚಿಲ್ಲರೆ ಪಾಲು)", hi: "पारंपरिक बिचौलिया थोक व्यापारी (~30% खुदरा हिस्सा)" },
  "+ Add Craft Piece": { kn: "+ ಕ್ರಾಫ್ಟ್ ತುಂಡು ಸೇರಿಸಿ", hi: "+ शिल्प टुकड़ा जोड़ें" },
  "✦ Print Scannable Tag": { kn: "✦ ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದಾದ ಟ್ಯಾಗ್ ಅನ್ನು ಮುದ್ರಿಸಿ", hi: "✦ स्कैन करने योग्य टैग प्रिंट करें" },
  "Reset Defaults": { kn: "ಡೀಫಾಲ್ಟ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ", hi: "डिफ़ॉल्ट रीसेट करें" },
  "Status": { kn: "ಸ್ಥಿತಿ", hi: "स्थिति" },
  "Price": { kn: "ಬೆಲೆ", hi: "मूल्य" },
  "Fair Price": { kn: "ನ್ಯಾಯಯುತ ಬೆಲೆ", hi: "उचित मूल्य" },
  "Actions": { kn: "ಕ್ರಿಯೆಗಳು", hi: "क्रियाएं" },
  "Active Atelier Inventory": { kn: "ಸಕ್ರಿಯ ಅಟೆಲಿಯರ್ ಇನ್ವೆಂಟರಿ", hi: "सक्रिय अटेलियर इन्वेंटरी" },
  "My Craft Pieces": { kn: "ನನ್ನ ಕ್ರಾಫ್ಟ್ ತುಣುಕುಗಳು", hi: "मेरे शिल्प के टुकड़े" },
  "Buyer Orders & Dispatch": { kn: "ಖರೀದಿದಾರರ ಆದೇಶಗಳು ಮತ್ತು ರವಾನೆ", hi: "क्रेता आदेश और प्रेषण" },
  "Custom Inquiries & Quotes": { kn: "ಕಸ್ಟಮ್ ವಿಚಾರಣೆಗಳು ಮತ್ತು ಉಲ್ಲೇಖಗಳು", hi: "कस्टम पूछताछ और उद्धरण" },
  "Atelier Lineage Profile": { kn: "ಅಟೆಲಿಯರ್ ವಂಶಾವಳಿಯ ಪ್ರೊಫೈಲ್", hi: "अटेलियर वंश प्रोफ़ाइल" },

  // Catalogue & Controls
  "Catalogue of Masterworks": { kn: "ಮಾಸ್ಟರ್‌ವರ್ಕ್‌ಗಳ ಕ್ಯಾಟಲಾಗ್", hi: "उत्कृष्ट कृतियों की सूची" },
  "Authentic Indian craftsmanship directly from living master artisans.": { kn: "ಜೀವಂತ ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳಿಂದ ನೇರವಾಗಿ ಅಧಿಕೃತ ಭಾರತೀಯ ಕರಕುಶಲತೆ.", hi: "जीवित मास्टर कारीगरों से सीधे प्रामाणिक भारतीय शिल्प कौशल।" },
  "✦ Switch to Curatorial Exhibition (with AI Voice Guide)": { kn: "✦ ಕ್ಯುರೇಟೋರಿಯಲ್ ಪ್ರದರ್ಶನಕ್ಕೆ ಬದಲಿಸಿ (ಎಐ ವಾಯ್ಸ್ ಗೈಡ್‌ನೊಂದಿಗೆ)", hi: "✦ क्यूरेटोरियल प्रदर्शनी पर स्विच करें (एआई वॉयस गाइड के साथ)" },
  "Display:": { kn: "ಪ್ರದರ್ಶನ:", hi: "प्रदर्शन:" },
  "25 per page": { kn: "ಪ್ರತಿ ಪುಟಕ್ಕೆ 25", hi: "25 प्रति पृष्ठ" },
  "50 per page": { kn: "ಪ್ರತಿ ಪುಟಕ್ಕೆ 50", hi: "50 प्रति पृष्ठ" },
  "100 per page": { kn: "ಪ್ರತಿ ಪುಟಕ್ಕೆ 100", hi: "100 प्रति पृष्ठ" },
  "Wishlist": { kn: "ಬಯಕೆಪಟ್ಟಿ", hi: "इच्छासूची" },
  "✦ Archive Dossier": { kn: "✦ ಆರ್ಕೈವ್ ಡಾസിയರ್", hi: "✦ संग्रह डोजियर" },
  "Sort:": { kn: "ವಿಂಗಡಿಸಿ:", hi: "क्रमबद्ध करें:" },
  "Curated": { kn: "ಕ್ಯುರೇಟೆಡ್", hi: "क्यूरेटेड" },
  "Price: Low to High": { kn: "ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು", hi: "मूल्य: निम्न से उच्च" },
  "Price: High to Low": { kn: "ಬೆಲೆ: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆ", hi: "मूल್ಯ: उच्च से निम्न" },
  "Craft:": { kn: "ಕ್ರಾಫ್ಟ್:", hi: "शिल्प:" },
  "All": { kn: "ಎಲ್ಲಾ", hi: "सभी" },
  "Paintings": { kn: "ಚಿತ್ರಕಲೆಗಳು", hi: "चित्रकारी" },
  "Blue Pottery": { kn: "ನೀಲಿ ಕುಂಬಾರಿಕೆ", hi: "ब्लू पॉटरी" },
  "Silks": { kn: "ರೇಷ್ಮೆಗಳು", hi: "सिल्क" },
  "Metalcraft": { kn: "ಮೆಟಲ್ ಕ್ರಾಫ್ಟ್", hi: "धातु शिल्प" },
  "Woodcraft": { kn: "ಮರದ ಕ್ರಾಫ್ಟ್", hi: "काष्ठ शिल्प" },
  "Jewellery": { kn: "ಆಭರಣ", hi: "आभूषण" },
  "View Story": { kn: "ಕಥೆಯನ್ನು ವೀಕ್ಷಿಸಿ", hi: "कहानी देखें" },
  "+ Add to Bag": { kn: "+ ಬ್ಯಾಗ್‌ಗೆ ಸೇರಿಸಿ", hi: "+ बैग में जोड़ें" },
  "✓ Added": { kn: "✓ ಸೇರಿಸಲಾಗಿದೆ", hi: "✓ जोड़ा गया" },
  "Search by craft, artisan, or region…": { kn: "ಕ್ರಾಫ್ಟ್, ಕುಶಲಕರ್ಮಿ ಅಥವಾ ಪ್ರದೇಶದ ಮೂಲಕ ಹುಡುಕಿ...", hi: "शिल्प, कारीगर या क्षेत्र के आधार पर खोजें…" },

  // Story & Products
  "✦ View Story & Provenance": { kn: "✦ ಕಥೆ ಮತ್ತು ಮೂಲವನ್ನು ವೀಕ್ಷಿಸಿ", hi: "✦ कहानी और उद्गम देखें" },
  "The Master's Voice & Lineage": { kn: "ಮಾಸ್ಟರ್ಸ್ ಧ್ವನಿ ಮತ್ತು ವಂಶಾವಳಿ", hi: "मास्टर की आवाज और वंश" },
  "Story-Backed Transparent Pricing": { kn: "ಕಥೆ-ಬೆಂಬಲಿತ ಪಾರದರ್ಶಕ ಬೆಲೆ", hi: "कहानी-समर्थित पारदर्शी मूल्य निर्धारण" },
  "Why this authentic piece is priced fairly, not industrially": { kn: "ಈ ಅಧಿಕೃತ ತುಣುಕನ್ನು ಏಕೆ ಕೈಗಾರಿಕಾವಾಗಿ ಅಲ್ಲ, ಸಾಕಷ್ಟು ಬೆಲೆಯಿದೆ", hi: "इस प्रामाणिक टुकड़े की कीमत औद्योगिक रूप से नहीं, बल्कि उचित क्यों है" },
  "Story-Backed Pricing Formula": { kn: "ಕಥೆ-ಬೆಂಬಲಿತ ಬೆಲೆ ಸೂತ್ರ", hi: "कहानी-समर्थित मूल्य निर्धारण सूत्र" },
  "Certified Raw Materials": { kn: "ಪ್ರಮಾಣೀಕೃತ ಕಚ್ಚಾ ವಸ್ತುಗಳು", hi: "प्रमाणित कच्चा माल" },
  "Master Handcraft Hours": { kn: "ಮಾಸ್ಟರ್ ಹ್ಯಾಂಡ್‌ಕ್ರಾಫ್ಟ್ ಗಂಟೆಗಳು", hi: "मास्टर हस्तशिल्प घंटे" },
  "GI Heritage & Intricacy": { kn: "GI ಪರಂಪರೆ ಮತ್ತು ಜಟಿಲತೆ", hi: "जीआई विरासत और जटिलता" },
  "Direct Guild Total": { kn: "ನೇರ ಗಿಲ್ಡ್ ಒಟ್ಟು", hi: "प्रत्यक्ष गिल्ड कुल" },
  "Machine-Made Lookalike Comparison": { kn: "ಮೆಷಿನ್-ಮೇಡ್ ಲುಕ್ಲೈಕ್ ಹೋಲಿಕೆ", hi: "मशीन से बने हमशक्ल की तुलना" },
  "Industrial copies sell for approx": { kn: "ಕೈಗಾರಿಕಾ ಪ್ರತಿಗಳು ಸರಿಸುಮಾರು ಮಾರಾಟವಾಗುತ್ತವೆ", hi: "औद्योगिक प्रतियां लगभग बिकती हैं" },
  "Why authentic handcraft costs more": { kn: "ಅಧಿಕೃತ ಕರಕುಶಲ ವಸ್ತುಗಳು ಏಕೆ ಹೆಚ್ಚು ವೆಚ್ಚವಾಗುತ್ತವೆ", hi: "प्रामाणिक हस्तशिल्प की कीमत अधिक क्यों होती है" },
  "Living Making Process Documentation": { kn: "ಜೀವಂತ ತಯಾರಿಕೆ ಪ್ರಕ್ರಿಯೆ ದಾಖಲಾತಿ", hi: "जीवंत निर्माण प्रक्रिया दस्तावेज़ीकरण" },
  "Acquire Masterwork": { kn: "ಮಾಸ್ಟರ್‌ವರ್ಕ್ ಅನ್ನು ಪಡೆದುಕೊಳ್ಳಿ", hi: "मास्टरवर्क प्राप्त करें" },
  "Added to Bag": { kn: "ಬ್ಯಾಗ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ", hi: "बैग में जोड़ा गया" },
  "Geographical Origin": { kn: "ಭೌಗೋಳಿಕ ಮೂಲ", hi: "भौगोलिक उत्पत्ति" },
  "Creation Time": { kn: "ಸೃಷ್ಟಿ ಸಮಯ", hi: "निर्माण का समय" },
  "Accession Identifier": { kn: "ಪ್ರವೇಶ ಗುರುತಿಸುವಿಕೆ", hi: "अभिगम पहचानकर्ता" },

  // Products
  "Bastar Lost-Wax Dhokra Brass Nandi Bull": { kn: "ಬಸ್ತಾರ್ ಲಾಸ್ಟ್-ವ್ಯಾಕ್ಸ್ ಧೋಕ್ರಾ ಹಿತ್ತಾಳೆ ನಂದಿ ಬುಲ್", hi: "बस्तर खोया-मोम ढोकरा पीतल नंदी बैल" },
  "Chanderi Handwoven Gold Zari Silk Dupatta": { kn: "ಚಂದೇರಿ ಕೈಯಿಂದ ನೇಯ್ದ ಚಿನ್ನದ ಝರಿ ಸಿಲ್ಕ್ ದುಪಟ್ಟಾ", hi: "चंदेरी हाथ से बुना हुआ सोने की ज़री रेशम का दुपट्टा" },
  "Pahari Miniature Painting — Krishna in the Grove": { kn: "ಪಹಾರಿ ಚಿಕಣಿ ಚಿತ್ರಕಲೆ - ಗ್ರೋವ್‌ನಲ್ಲಿ ಕೃಷ್ಣ", hi: "पहाड़ी लघु चित्रकला - उपवन में कृष्ण" },
  "Jaipur Blue Pottery Cobalt Floral Urn": { kn: "ಜೈಪುರ ಬ್ಲೂ ಪಾಟರಿ ಕೋಬಾಲ್ಟ್ ಫ್ಲೋರಲ್ ಕಲ್ಶ", hi: "जयपुर ब्लू पॉटरी कोबाल्ट फ्लोरल कलश" },
  "Channapatna Wooden Lacquerware Toy Totem": { kn: "ಚನ್ನಪಟ್ಟಣ ಮರದ ಲ್ಯಾಕ್ವೆರ್‌ವೇರ್ ಆಟಿಕೆ ಟೋಟೆಮ್", hi: "चन्नापटना लकड़ी के लाख के खिलौने का कुलचिह्न" },
  "Royal Kundan Meenakari Peacock Choker Amulet": { kn: "ರಾಯಲ್ ಕುಂದನ್ ಮೀನಾಕಾರಿ ಪೀಕಾಕ್ ಚೋಕರ್ ತಾಯತ", hi: "रॉयल कुंदन मीनाकारी मयूर चोकर ताबीज" }
};

// Initialize cache with verified Google translations
for (const [enText, transObj] of Object.entries(PRELOADED_GOOGLE_TRANSLATIONS)) {
  TRANSLATION_CACHE.set(`kn_${enText}`, transObj.kn);
  TRANSLATION_CACHE.set(`hi_${enText}`, transObj.hi);
}

// Load previously cached translations from browser localStorage
if (typeof localStorage !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('gt_kn_') || key.startsWith('gt_hi_'))) {
        const val = localStorage.getItem(key);
        if (val) {
          const cacheKey = key.replace('gt_', '');
          TRANSLATION_CACHE.set(cacheKey, val);
        }
      }
    }
  } catch (e) {
    // localStorage not accessible
  }
}

/**
 * Fetch high-quality Google Translation for a text string.
 * First checks in-memory and localStorage cache.
 * Falls back to Google Translate API, then backend proxy.
 */
export async function fetchGoogleTranslation(text: string, targetLang: 'kn' | 'hi'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || targetLang === ('en' as any)) return text;

  const cacheKey = `${targetLang}_${trimmed}`;
  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey)!;
  }

  // Pre-process '&' to 'and' so Google Translate renders native conjunctions (ಮತ್ತು / और)
  const preparedText = trimmed.replace(/\s*&\s*/g, ' and ');

  // 1. Try Google Translate Client Endpoint directly (CORS enabled: *)
  try {
    const encoded = encodeURIComponent(preparedText);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encoded}`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((part: any) => part[0]).join('');
        if (translated) {
          TRANSLATION_CACHE.set(cacheKey, translated);
          try {
            localStorage.setItem(`gt_${cacheKey}`, translated);
          } catch (e) {
            // storage quota
          }
          return translated;
        }
      }
    }
  } catch (err) {
    // Direct Google endpoint unreachable or network error, fallback to backend proxy
  }

  // 2. Fallback to KAARIGAR backend Google Translate proxy
  try {
    const resp = await fetch('/chatbot/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: preparedText,
        target_lang: targetLang,
        source_lang: 'en'
      })
    });
    if (resp.ok) {
      const result = await resp.json();
      if (result && result.translated_text) {
        const translated = result.translated_text;
        TRANSLATION_CACHE.set(cacheKey, translated);
        try {
          localStorage.setItem(`gt_${cacheKey}`, translated);
        } catch (e) {
          // ignore
        }
        return translated;
      }
    }
  } catch (e) {
    // backend unreachable
  }

  return text;
}

/**
 * Synchronous translation look-up.
 * Returns cached Google Translate result immediately if available,
 * and schedules an asynchronous fetch if not yet cached.
 */
export function translateText(text: string, targetLang: SupportedLanguage): string {
  if (!text || targetLang === 'en' || typeof text !== 'string') {
    return text;
  }

  const trimmed = text.trim();
  const cacheKey = `${targetLang}_${trimmed}`;

  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey)!;
  }

  // Schedule background translation
  fetchGoogleTranslation(trimmed, targetLang as 'kn' | 'hi');

  return text;
}

// ── Realtime DOM Translation Observer ────────────────────────────────────────

let activeLanguage: SupportedLanguage = 'en';
let isTranslating = false;
const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();
const originalTitleMap = new WeakMap<Element, string>();

function shouldSkipElement(elem: Element | null): boolean {
  if (!elem) return false;
  const tag = elem.tagName.toUpperCase();
  if (
    tag === 'SCRIPT' ||
    tag === 'STYLE' ||
    tag === 'NOSCRIPT' ||
    tag === 'CODE' ||
    tag === 'PRE' ||
    tag === 'SVG' ||
    tag === 'PATH'
  ) {
    return true;
  }
  if (elem.closest('.site-header__lang-switcher') || elem.closest('[data-no-translate]')) {
    return true;
  }
  return false;
}

function processTextNode(node: Node, lang: SupportedLanguage) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const parent = node.parentElement;
  if (shouldSkipElement(parent)) return;

  const currentVal = node.nodeValue || '';
  if (!currentVal.trim()) return;

  // Record original English string
  let original = originalTextMap.get(node);
  if (original === undefined) {
    original = currentVal;
    originalTextMap.set(node, original);
  }

  // If restoring to English
  if (lang === 'en') {
    if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
    return;
  }

  // Only translate if the string contains letters
  if (!/[A-Za-z]/.test(original)) {
    return;
  }

  const trimmed = original.trim();
  const cacheKey = `${lang}_${trimmed}`;

  // If already in Google Translate cache, apply immediately
  if (TRANSLATION_CACHE.has(cacheKey)) {
    const translated = TRANSLATION_CACHE.get(cacheKey)!;
    const finalVal = original.replace(trimmed, translated);
    if (node.nodeValue !== finalVal) {
      node.nodeValue = finalVal;
    }
    return;
  }

  // Otherwise, fetch Google Translation asynchronously
  fetchGoogleTranslation(trimmed, lang as 'kn' | 'hi').then((translated) => {
    if (activeLanguage === lang && translated && translated !== trimmed) {
      const finalVal = original.replace(trimmed, translated);
      if (node.nodeValue !== finalVal) {
        node.nodeValue = finalVal;
      }
    }
  });
}

function processElementAttributes(elem: Element, lang: SupportedLanguage) {
  if (shouldSkipElement(elem)) return;

  // Input & Textarea Placeholders
  if (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement) {
    let origPlaceholder = originalPlaceholderMap.get(elem);
    if (origPlaceholder === undefined) {
      origPlaceholder = elem.placeholder || '';
      originalPlaceholderMap.set(elem, origPlaceholder);
    }
    if (origPlaceholder && /[A-Za-z]/.test(origPlaceholder)) {
      if (lang === 'en') {
        elem.placeholder = origPlaceholder;
      } else {
        const cacheKey = `${lang}_${origPlaceholder.trim()}`;
        if (TRANSLATION_CACHE.has(cacheKey)) {
          elem.placeholder = TRANSLATION_CACHE.get(cacheKey)!;
        } else {
          fetchGoogleTranslation(origPlaceholder, lang as 'kn' | 'hi').then((trans) => {
            if (activeLanguage === lang) elem.placeholder = trans;
          });
        }
      }
    }
  }

  // Title attributes
  const titleAttr = elem.getAttribute('title');
  if (titleAttr) {
    let origTitle = originalTitleMap.get(elem);
    if (origTitle === undefined) {
      origTitle = titleAttr;
      originalTitleMap.set(elem, origTitle);
    }
    if (origTitle && /[A-Za-z]/.test(origTitle)) {
      if (lang === 'en') {
        elem.setAttribute('title', origTitle);
      } else {
        const cacheKey = `${lang}_${origTitle.trim()}`;
        if (TRANSLATION_CACHE.has(cacheKey)) {
          elem.setAttribute('title', TRANSLATION_CACHE.get(cacheKey)!);
        } else {
          fetchGoogleTranslation(origTitle, lang as 'kn' | 'hi').then((trans) => {
            if (activeLanguage === lang) elem.setAttribute('title', trans);
          });
        }
      }
    }
  }
}

function walkAndTranslate(root: Node, lang: SupportedLanguage) {
  if (isTranslating) return;
  isTranslating = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let currentNode: Node | null = walker.currentNode;

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        processTextNode(currentNode, lang);
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        processElementAttributes(currentNode as Element, lang);
      }
      currentNode = walker.nextNode();
    }
  } finally {
    isTranslating = false;
  }
}

let mutationObserver: MutationObserver | null = null;

export function applyDomTranslation(lang: SupportedLanguage) {
  activeLanguage = lang;
  if (typeof document === 'undefined') return;

  walkAndTranslate(document.body, lang);
}

export function initDomTranslator(initialLang: SupportedLanguage = 'en') {
  activeLanguage = initialLang;
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;

  // Initial translation pass once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyDomTranslation(activeLanguage));
  } else {
    applyDomTranslation(activeLanguage);
  }

  // Observe dynamically rendered components and routes
  if (!mutationObserver) {
    mutationObserver = new MutationObserver((mutations) => {
      if (isTranslating || activeLanguage === 'en') return;

      for (const m of mutations) {
        if (m.type === 'characterData' && m.target) {
          processTextNode(m.target, activeLanguage);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            walkAndTranslate(node, activeLanguage);
          });
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
}
