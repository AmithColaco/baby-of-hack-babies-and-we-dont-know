// KAARIGAR — Universal Indic Translation Engine (English <-> Kannada <-> Hindi)
// Translates all words across the web application while strictly preserving all
// numbers (e.g. 148+, ₹42.8 Lakhs, +280%, ₹18,400, 92%, 123456, 25 per page)
// and special characters (₹, $, %, +, -, *, /, =, ✦, ·, 👁, 📍, 💡, ✓, ★, —, &, |, !, ?, etc.).

export type SupportedLanguage = 'en' | 'kn' | 'hi';

// ── Multi-word phrase dictionary (matched greedily before single words) ──────
export const PHRASE_DICTIONARY: Record<string, { kn: string; hi: string }> = {
  // Navigation & Branding
  "living craft archive": { kn: "ಜೀವಂತ ಕರಕುಶಲ ಕಲಾ ದಾಖಲೆ", hi: "जीवंत शिल्प धरोहर अभिलेखागार" },
  "living craft sanctuary": { kn: "ಜೀವಂತ ಕರಕುಶಲ ಆಲಯ", hi: "जीवंत हस्तशिल्प धाम" },
  "guardians of india's living hands": { kn: "ಭಾರತದ ಜೀವಂತ ಕೈಗಳ ಸಂರಕ್ಷಕರು", hi: "भारत के जीवंत हाथों के संरक्षक" },
  "living gallery": { kn: "ಜೀವಂತ ಗ್ಯಾಲರಿ", hi: "जीवंत दीर्घा" },
  "custom commissions": { kn: "ವಿಶೇಷ ಕಸ್ಟಮ್ ಬೇಡಿಕೆಗಳು", hi: "कस्टम शिल्पकला अनुरोध" },
  "master artisans": { kn: "ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳು", hi: "राष्ट्रीय मास्टर शिल्पकार" },
  "craft journey": { kn: "ಕರಕುಶಲ ಯಾನ", hi: "शिल्प निर्माण यात्रा" },
  "artisan atelier": { kn: "ಕುಶಲಕರ್ಮಿ ಅಟೆಲಿಯರ್", hi: "शिल्पकार कार्यशाला" },
  "shopping bag": { kn: "ಶಾಪಿಂಗ್ ಬ್ಯಾಗ್", hi: "खरीदारी बैग" },
  "saved heirlooms": { kn: "ಮೆಚ್ಚಿನ ಕಲಾಕೃತಿಗಳು", hi: "सहेजे गए स्मृतिचिह्न" },
  "my acquisitions": { kn: "ನನ್ನ ಕಲಾ ಸಂಗ್ರಹಗಳು", hi: "मेरी प्राप्त कलाकृतियां" },
  "my craft pieces": { kn: "ನನ್ನ ಕಲಾಕೃತಿಗಳು", hi: "मेरी शिल्प कृतियां" },
  "buyer orders": { kn: "ಗ್ರಾಹಕರ ಆರ್ಡರ್‌ಗಳು", hi: "क्रेता आदेश" },
  "buyer orders & dispatch": { kn: "ಗ್ರಾಹಕರ ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ರವಾನೆ", hi: "क्रेता आदेश और प्रेषण" },
  "custom inquiries & quotes": { kn: "ಕಸ್ಟಮ್ ವಿಚಾರಣೆಗಳು ಮತ್ತು ಕೋಟ್‌ಗಳು", hi: "कस्टम पूछताछ और उद्धरण" },
  "atelier lineage profile": { kn: "ಅಟೆಲಿಯರ್ ಪರಂಪರೆ ವಿವರ", hi: "कार्यशाला वंशावली प्रोफ़ाइल" },
  "active atelier inventory": { kn: "ಸಕ್ರಿಯ ಕಲಾಕೃತಿಗಳ ಪಟ್ಟಿ", hi: "सक्रिय कार्यशाला सूची" },
  "sign out": { kn: "ಲಾಗ್‌ಔಟ್", hi: "लॉग आउट" },
  "sign in": { kn: "ಲಾಗಿನ್", hi: "लॉग इन" },

  // Home Impact Metrics & Pillars
  "measurable artisan impact": { kn: "ಕುಶಲಕರ್ಮಿಗಳ ಆರ್ಥಿಕ ಪ್ರಗತಿ ಮತ್ತು ಗೌರವ", hi: "शिल्पकार प्रभाव और आर्थिक स्वाभिमान" },
  "measurable artisan impact & economic dignity": { kn: "ಕುಶಲಕರ್ಮಿಗಳ ಆರ್ಥಿಕ ಪ್ರಗತಿ ಮತ್ತು ಗೌರವ", hi: "शिल्पकार प्रभाव और आर्थिक स्वाभिಮಾನ" },
  "economic dignity": { kn: "ಆರ್ಥಿಕ ಗೌರವ", hi: "आर्थिक स्वाभिमान" },
  "living master artisans": { kn: "ಜೀವಂತ ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳು", hi: "जीवंत राष्ट्रीय मास्टर शिल्पकार" },
  "direct guild disbursal": { kn: "ನೇರ ಕಲಾ ಸಂಘದ ಪಾವತಿ", hi: "सीधा गिल्ड संवितरण" },
  "average income uplift": { kn: "ಸರಾಸರಿ ಆದಾಯ ಏರಿಕೆ", hi: "औसत आय वृद्धि" },
  "women shg guild share": { kn: "ಮಹಿಳಾ ಸ್ವಸಹಾಯ ಸಂಘಗಳ ಪಾಲು", hi: "महिला स्वयं सहायता समूह भागीदारी" },
  "women-led guild": { kn: "ಮಹಿಳಾ ಸ್ವಸಹಾಯ ಸಂಘ", hi: "महिला-संचालित गिल्ड" },
  "kasuti women's collective": { kn: "ಮಹಿಳಾ ಕಸೂತಿ ಸಹಕಾರಿ ಸಂಘ", hi: "कसूती महिला सहकारी संघ" },
  "verified collective metrics": { kn: "ದೃಢೀಕೃತ ಸಾಮೂಹಿಕ ಅಂಕಿಅಂಶಗಳು", hi: "सत्यापित सामूहिक आंकड़े" },
  "verified collective metrics & projections across 6 geographical indication clusters": { kn: "6 ಭೌಗೋಳಿಕ ಸೂಚ್ಯಂಕ (GI) ಕೇಂದ್ರಗಳ ದೃಢೀಕೃತ ಅಂಕಿಅಂಶಗಳು ಮತ್ತು ಮುನ್ನೋಟಗಳು", hi: "6 भौगोलिक संकेतक (GI) संकुलों के सत्यापित आंकड़े और अनुमान" },
  "across 6 geographical indication clusters": { kn: "6 ಭೌಗೋಳಿಕ ಸೂಚ್ಯಂಕ (GI) ಕೇಂದ್ರಗಳಾದ್ಯಂತ", hi: "6 भौगोलिक संकेतक (GI) संकुलों में" },
  "6 gi clusters across karnataka, mp, bastar & rajasthan": { kn: "ಕರ್ನಾಟಕ, ಎಂಪಿ, ಬಸ್ತಾರ್ & ರಾಜಸ್ಥಾನದಾದ್ಯಂತ 6 ಜಿಐ ಕ್ಲಸ್ಟರ್‌ಗಳು", hi: "कर्नाटक, एमपी, बस्तर व राजस्थान में 6 जीआई संकुल" },
  "paid straight to artisan accounts via upi escrow": { kn: "ಯುಪಿಐ ಎಸ್ಕ್ರೋ ಮೂಲಕ ನೇರವಾಗಿ ಕುಶಲಕರ್ಮಿಗಳ ಖಾತೆಗೆ ಪಾವತಿ", hi: "यूपीआई एस्क्रो द्वारा सीधे शिल्पकार खातों में भुगतान" },
  "compared to conventional wholesale trader procurement": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಸಗಟು ವ್ಯಾಪಾರಿಗಳ ಖರೀದಿಗೆ ಹೋಲಿಸಿದರೆ", hi: "पारंपरिक थोक व्यापारी खरीद की तुलना में" },
  "kaarigar direct guild model (92% payout)": { kn: "ಕಾರೀಗರ್ ನೇರ ಸಂಘ ಮಾದರಿ (92% ನೇರ ಪಾವತಿ)", hi: "कारीगर प्रत्यक्ष गिल्ड मॉडल (92% भुगतान)" },
  "kaarigar direct guild model": { kn: "ಕಾರೀಗರ್ ನೇರ ಸಂಘ ಮಾದರಿ", hi: "कारीगर प्रत्यक्ष गिल्ड मॉडल" },
  "conventional middleman wholesale trader (~30% retail share)": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಮಧ್ಯವರ್ತಿ ವ್ಯಾಪಾರಿ (~30% ಚಿಲ್ಲರೆ ಪಾಲು)", hi: "पारंपरिक बिचौलिया थोक व्यापारी (~30% खुदरा हिस्सा)" },
  "conventional middleman wholesale trader": { kn: "ಸಾಂಪ್ರದಾಯಿಕ ಮಧ್ಯವರ್ತಿ ವ್ಯಾಪಾರಿ", hi: "पारंपरिक बिचौलिया थोक व्यापारी" },
  "direct community disbursal": { kn: "ನೇರ ಸಮುದಾಯ ಸಂದಾಯ", hi: "प्रत्यक्ष समुदाय संवितरण" },
  "oral provenance & tag": { kn: "ಧ್ವನಿ ದಾಖಲೆ ಮತ್ತು ಟ್ಯಾಗ್", hi: "मौखिक इतिहास व प्रामाणिकता टैग" },
  "story-backed fair pricing": { kn: "ಕಥೆ-ಆಧಾರಿತ ನ್ಯಾಯಯುತ ಬೆಲೆ", hi: "पारदर्शी कहानी-समर्थित मूल्य" },
  "three pillars of kaarigar": { kn: "ಕಾರೀಗರ್‌ನ ಮೂರು ಮೂಲತತ್ವಗಳು", hi: "कारीगर के तीन आधार स्तंभ" },
  "the three pillars of kaarigar": { kn: "ಕಾರೀಗರ್‌ನ ಮೂರು ಮೂಲತತ್ವಗಳು", hi: "कारीगर के तीन आधार स्तंभ" },
  "enter exhibition gallery": { kn: "ಪ್ರದರ್ಶನ ಗ್ಯಾಲರಿ ಪ್ರವೇಶಿಸಿ", hi: "प्रदर्शनी दीर्घा में प्रवेश करें" },
  "commission a masterpiece": { kn: "ವಿಶೇಷ ಕೃತಿಯನ್ನು ಆರ್ಡರ್ ಮಾಡಿ", hi: "एक उत्कृष्ट कृति तैयार करवाएं" },
  "view all 7 gi traditions": { kn: "ಎಲ್ಲಾ 7 ಜಿಐ ಕಲೆಗಳನ್ನು ನೋಡಿ", hi: "सभी 7 जीआई परंपराएं देखें" },
  "inspect story & provenance": { kn: "ಕಥೆ ಮತ್ತು ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ", hi: "कहानी और प्रामाणिकता देखें" },
  "masterpieces of living heritage": { kn: "ಜೀವಂತ ಪರಂಪರೆಯ ಶ್ರೇಷ್ಠ ಕೃತಿಗಳು", hi: "जीवंत सांस्कृतिक धरोहर की कृतियां" },
  "from source to sanctuary": { kn: "ಮೂಲದಿಂದ ನಿಮ್ಮ ಮನೆಗೆ", hi: "स्रोत से आपके आशियाने तक" },

  // Dashboard Earnings
  "you earned": { kn: "ನೀವು ಗಳಿಸಿದ್ದೀರಿ", hi: "आपने कमाए" },
  "this month": { kn: "ಈ ತಿಂಗಳು", hi: "इस महीने" },
  "versus roughly": { kn: "ಸರಿಸುಮಾರು ಬದಲಿಗೆ", hi: "लगभग के बदले" },
  "through a middleman": { kn: "ಮಧ್ಯವರ್ತಿಯ ಮೂಲಕ", hi: "बिचौलिए के माध्यम से" },
  "more in your family account": { kn: "ಹೆಚ್ಚು ನಿಮ್ಮ ಕುಟುಂಬದ ಖಾತೆಗೆ", hi: "अधिक आपके पारिवारिक खाते में" },

  // Catalogue, Shop & Controls
  "items per page": { kn: "ಪ್ರತಿ ಪುಟದ ವಸ್ತುಗಳು", hi: "प्रति पृष्ठ वस्तुएं" },
  "per page": { kn: "ಪ್ರತಿ ಪುಟಕ್ಕೆ", hi: "प्रति पृष्ठ" },
  "display:": { kn: "ಪ್ರದರ್ಶನ:", hi: "प्रदर्शन:" },
  "sort:": { kn: "ವಿಂಗಡಣೆ:", hi: "क्रमबद्ध:" },
  "craft:": { kn: "ಕಲೆ:", hi: "शिल्प:" },
  "price: low to high": { kn: "ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ", hi: "मूल्य: कम से अधिक" },
  "price: high to low": { kn: "ಬೆಲೆ: ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ", hi: "मूल्य: अधिक से कम" },
  "low to high": { kn: "ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚಿಗೆ", hi: "कम से अधिक" },
  "high to low": { kn: "ಹೆಚ್ಚಿನಿಂದ ಕಡಿಮೆಗೆ", hi: "अधिक से कम" },
  "archive dossier": { kn: "ದಾಖಲೆಗಳ ವಿವರ", hi: "संग्रह दस्तावेज" },
  "all traditions": { kn: "ಎಲ್ಲಾ ಕಲಾ ಪ್ರಕಾರಗಳು", hi: "सभी परंपराएं" },
  "all crafts": { kn: "ಎಲ್ಲಾ ಕರಕುಶಲ ಕಲೆಗಳು", hi: "सभी हस्तशिल्प" },
  "craft disciplines": { kn: "ಕರಕುಶಲ ವಿಭಾಗಗಳು", hi: "शिल्प विधाएं" },
  "scannable provenance": { kn: "ಸ್ಕ್ಯಾನ್ ಮಾಡಬಹುದಾದ ಇತಿಹಾಸ", hi: "स्कैन करने योग्य प्रामाणिकता" },
  "add to bag": { kn: "ಚೀಲಕ್ಕೆ ಸೇರಿಸಿ", hi: "थैले में जोड़ें" },
  "added to bag": { kn: "ಚೀಲಕ್ಕೆ ಸೇರಿಸಲಾಗಿದೆ", hi: "थैले में जोड़ा गया" },
  "view story": { kn: "ಕಥೆ ವೀಕ್ಷಿಸಿ", hi: "कहानी देखें" },
  "view story & provenance": { kn: "ಕಥೆ ಮತ್ತು ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ", hi: "कहानी और प्रामाणिकता देखें" },
  "acquire masterwork": { kn: "ಕಲಾಕೃತಿ ಪಡೆಯಿರಿ", hi: "कलाकृति प्राप्त करें" },
  "print scannable tag": { kn: "ಸ್ಕ್ಯಾನ್ ಟ್ಯಾಗ್ ಮುದ್ರಿಸಿ", hi: "स्कैन टैग प्रिंट करें" },
  "reset defaults": { kn: "ಮರುಹೊಂದಿಸಿ", hi: "रीसेट करें" },
  "catalogue of masterworks": { kn: "ಶ್ರೇಷ್ಠ ಕಲಾಕೃತಿಗಳ ಕ್ಯಾಟಲಾಗ್", hi: "उत्कृष्ट कृतियों की सूची" },
  "authentic indian craftsmanship directly from living master artisans": { kn: "ಜೀವಂತ ಮಾಸ್ಟರ್ ಕುಶಲಕರ್ಮಿಗಳಿಂದ ನೇರ, ಅಧಿಕೃತ ಭಾರತೀಯ ಕರಕುಶಲತೆ.", hi: "जीवंत मास्टर शिल्पकारों से सीधे प्रामाणिक भारतीय हस्तकला।" },
  "switch to curatorial exhibition (with ai voice guide)": { kn: "ವಸ್ತುಪ್ರದರ್ಶನ ಗ್ಯಾಲರಿಗೆ ಬದಲಾಯಿಸಿ (ಎಐ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿಯೊಂದಿಗೆ)", hi: "प्रदर्शनी दीर्घा पर स्विच करें (एआई वॉयस गाइड के साथ)" },
  "switch to curatorial exhibition": { kn: "ವಸ್ತುಪ್ರದರ್ಶನ ಗ್ಯಾಲರಿಗೆ ಬದಲಾಯಿಸಿ", hi: "प्रदर्शनी दीर्घा पर स्विच करें" },
  "with ai voice guide": { kn: "ಎಐ ಧ್ವನಿ ಮಾರ್ಗದರ್ಶಿಯೊಂದಿಗೆ", hi: "एआई वॉयस गाइड के साथ" },
  "blue pottery": { kn: "ನೀಲಿ ಮಣ್ಣಿನ ಕಲೆ", hi: "ब्लू पॉटरी" },
  "search by craft, artisan, or region": { kn: "ಕಲೆ, ಕುಶಲಕರ್ಮಿ ಅಥವಾ ಪ್ರದೇಶದಿಂದ ಹುಡುಕಿ", hi: "शिल्प, शिल्पकार या क्षेत्र से खोजें" },
  "search by craft, region, or artisan": { kn: "ಕಲೆ, ಪ್ರದೇಶ ಅಥವಾ ಕುಶಲಕರ್ಮಿಯ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ", hi: "शिल्प, क्षेत्र या शिल्पकार के नाम से खोजें" },
  "clear search query": { kn: "ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ", hi: "खोज साफ़ करें" },
  "filter crafts": { kn: "ಕಲೆಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ", hi: "शिल्प फ़िल्टर करें" },

  // Product & Pricing Storyboard
  "geographical origin": { kn: "ಭೌಗೋಳಿಕ ಮೂಲ", hi: "भौगोलिक उत्पत्ति" },
  "creation time": { kn: "ರಚನಾ ಅವಧಿ", hi: "निर्माण समय" },
  "accession identifier": { kn: "ದಾಖಲಾತಿ ಗುರುತು", hi: "पंजीकरण पहचानकर्ता" },
  "the master's voice & lineage": { kn: "ಕುಶಲಕರ್ಮಿಯ ಧ್ವನಿ ಮತ್ತು ಇತಿಹಾಸ", hi: "शिल्पकार की वाणी और वंश परंपरा" },
  "story-backed transparent pricing": { kn: "ಕಥೆ-ಬೆಂಬಲಿತ ಪಾರದರ್ಶಕ ಬೆಲೆ ಸೂತ್ರ", hi: "कहानी-समर्थित पारदर्शी मूल्य निर्धारण" },
  "why this authentic piece is priced fairly, not industrially": { kn: "ಈ ಅಧಿಕೃತ ಕೃತಿಗೆ ಈ ಬೆಲೆ ಏಕೆ ಸೂಕ್ತವಾಗಿದೆ?", hi: "यह प्रामाणिक कृति औद्योगिक नहीं, बल्कि उचित मूल्य पर क्यों है?" },
  "story-backed pricing formula": { kn: "ಬೆಲೆ ನಿರ್ಧಾರದ ಸೂತ್ರ", hi: "मूल्य निर्धारण सूत्र" },
  "certified raw materials": { kn: "ಪ್ರಮಾಣೀಕೃತ ನೈಜ ಕಚ್ಚಾ ಸಾಮಗ್ರಿಗಳು", hi: "प्रमाणित कच्चा माल" },
  "master handcraft hours": { kn: "ಕುಶಲಕರ್ಮಿಯ ಶ್ರಮದ ಗಂಟೆಗಳು", hi: "शिल्पकार श्रम घंटे" },
  "gi heritage & intricacy": { kn: "ಜಿಐ ಪರಂಪರೆ ಮತ್ತು ನೈಪುಣ್ಯತೆ", hi: "जीआई विरासत और सूक्ष्मता" },
  "direct guild total": { kn: "ಒಟ್ಟು ನ್ಯಾಯಯುತ ಬೆಲೆ", hi: "कुल प्रत्यक्ष गिल्ड मूल्य" },
  "machine-made lookalike comparison": { kn: "ಯಂತ್ರದಿಂದ ತಯಾರಿಸಿದ ನಕಲಿಗಳೊಂದಿಗೆ ಹೋಲಿಕೆ", hi: "मशीनी प्रतियों से तुलना" },
  "industrial copies sell for approx": { kn: "ಯಂತ್ರದ ನಕಲಿಗಳು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ದೊರೆಯುವ ಬೆಲೆ", hi: "औद्योगिक प्रतियां लगभग इस दाम में बिकती हैं" },
  "why authentic handcraft costs more": { kn: "ಅಧಿಕೃತ ಕೈಮಗ್ಗ/ಕರಕುಶಲ ಏಕೆ ಹೆಚ್ಚು ಮೌಲ್ಯಯುತವಾಗಿದೆ", hi: "प्रामाणिक हस्तशिल्प अधिक मूल्यवान क्यों है" },
  "living making process documentation": { kn: "ತಯಾರಿಕೆಯ ಜೀವಂತ ಹಂತಗಳ ದಸ್ತಾವೇಜು", hi: "जीवंत निर्माण प्रक्रिया दस्तावेजीकरण" },
  "listen to the master describe their technique": { kn: "ಕುಶಲಕರ್ಮಿ ತಮ್ಮ ಮಾತಿನಲ್ಲಿ ಕಲೆಯ ರಹಸ್ಯವನ್ನು ವಿವರಿಸುವುದನ್ನು ಆಲಿಸಿ", hi: "शिल्पकार से अपनी मातृभाषा में तकनीक का वर्णन सुनें" },
  "view provenance & artisan hang-tag": { kn: "ಕಲೆಯ ಇತಿಹಾಸ ಮತ್ತು ಟ್ಯಾಗ್ ವೀಕ್ಷಿಸಿ", hi: "प्रामाणिकता और शिल्पकार टैग देखें" },

  // Spatial AI & Craft in Your Space
  "craft in your space": { kn: "ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಕರಕುಶಲ ಕಲೆ", hi: "आपके स्थान में हस्तशिल्प" },
  "ai interior stylist": { kn: "ಎಐ ಒಳಾಂಗಣ ವಿನ್ಯಾಸಕಾರ", hi: "एआई इंटीरियर स्टाइलिस्ट" },
  "principal spatial ai architect": { kn: "ಮುಖ್ಯ ಪ್ರಾದೇಶಿಕ ಎಐ ವಿನ್ಯಾಸ ತಜ್ಞ", hi: "मुख्य स्थानिक एआई वास्तुकार" },
  "architectural aesthetic": { kn: "ವಾಸ್ತುಶಿಲ್ಪ ಸೌಂದರ್ಯ", hi: "वास्तुशिल्प सौंदर्य" },
  "materiality extraction": { kn: "ಸಾಮಗ್ರಿಗಳ ವಿಶ್ಲೇಷಣೆ", hi: "पदार्थ संरचना निष्कर्षण" },
  "photometric & light temperature": { kn: "ಬೆಳಕು ಮತ್ತು ವರ್ಣ ತಾಪಮಾನ", hi: "प्रकाश व्यवस्था और रंग तापमान" },
  "spatial clearance": { kn: "ಜಾಗದ ಅಂತರ ಮತ್ತು ಪರಿಶೀಲನೆ", hi: "स्थानिक दूरी और सुरक्षा नियम" },
  "spatial placement": { kn: "ಜಾಗದಲ್ಲಿ ಇರಿಸುವ ಸ್ಥಳ", hi: "स्थानिक स्थिति" },
  "masterwork harmonization": { kn: "ಶ್ರೇಷ್ಠ ಕಲಾ ಸಮನ್ವಯ", hi: "मास्टरवर्क सामंजस्य" },
  "architectural narrative": { kn: "ವಾಸ್ತುಶಿಲ್ಪದ ವಿವರಣೆ", hi: "वास्तुशिल्प विवरण" },
  "interior style": { kn: "ಒಳಾಂಗಣ ಶೈಲಿ", hi: "इंटीरियर शैली" },
  "space mood": { kn: "ಜಾಗದ ವಾತಾವರಣ", hi: "स्थानिक भाव" },
  "best for": { kn: "ಸೂಕ್ತವಾದ ಸ್ಥಳ", hi: "उत्तम स्थान" },
  "photometrics": { kn: "ಬೆಳಕಿನ ಪ್ರಮಾಣ", hi: "प्रकाश माप" },
  "envelope": { kn: "ಕೊಠಡಿಯ ವಿನ್ಯಾಸ", hi: "कक्ष संरचना" },

  // Craft Names & Traditions
  "bastar lost-wax dhokra": { kn: "ಬಸ್ತಾರ್ ಕಳೆದುಹೋದ-ಮೇಣದ ಧೋಕ್ರಾ ಹಿತ್ತಾಳೆ", hi: "बस्तर लॉस्ट-वैक्स ढोकरा कांस्य" },
  "chanderi handwoven silk": { kn: "ಚಂದೇರಿ ಕೈಮಗ್ಗ ರೇಷ್ಮೆ", hi: "चंदेरी हाथ से बुना सिल्क" },
  "pahari miniature painting": { kn: "ಪಹಾಡಿ ಸೂಕ್ಷ್ಮ ಕಲಾ ವರ್ಣಚಿತ್ರ", hi: "पहाड़ी लघु चित्रकला" },
  "jaipur blue pottery": { kn: "ಜೈಪುರ ನೀಲಿ ಮಣ್ಣಿನ ಕಲೆ", hi: "जयपुर ब्लू पॉटरी" },
  "channapatna woodcraft": { kn: "ಚನ್ನಪಟ್ಟಣ ಮರದ ಕೆತ್ತನೆ ಕಲೆ", hi: "चन्नपटना काष्ठ कला" },
  "kundan meenakari jewellery": { kn: "ಕುಂದನ್ ಮೀನಾಕಾರಿ ರಾಜಮನೆತನದ ಆಭರಣ", hi: "कुंदन मीनाकारी शाही आभूषण" },
  "kasuti embroidery": { kn: "ಕಸೂತಿ ಕಸೂತಿ ಕಲೆ", hi: "कसूती कढ़ाई कला" },
  "ilkal saree": { kn: "ಇಳಕಲ್ ಸೀರೆ", hi: "इल्कल साड़ी" }
};

// ── Single-word dictionary ──────────────────────────────────────────────────
export const WORD_DICTIONARY: Record<string, { kn: string; hi: string }> = {
  // Navigation & General UI
  "storefront": { kn: "ಮಳಿಗೆ", hi: "दुकान" },
  "shop": { kn: "ಅಂಗಡಿ", hi: "खरीदारी" },
  "gallery": { kn: "ಗ್ಯಾಲರಿ", hi: "दीर्घा" },
  "commissions": { kn: "ಬೇಡಿಕೆಗಳು", hi: "ऑर्डर" },
  "commission": { kn: "ವಿಶೇಷ ಬೇಡಿಕೆ", hi: "कस्टम ऑर्डर" },
  "artisans": { kn: "ಕುಶಲಕರ್ಮಿಗಳು", hi: "शिल्पकार" },
  "artisan": { kn: "ಕುಶಲಕರ್ಮಿ", hi: "शिल्पकार" },
  "process": { kn: "ಪ್ರಕ್ರಿಯೆ", hi: "प्रक्रिया" },
  "dashboard": { kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", hi: "डैशबोर्ड" },
  "cart": { kn: "ಚೀಲ", hi: "झोला" },
  "bag": { kn: "ಚೀಲ", hi: "थैला" },
  "wishlist": { kn: "ಮೆಚ್ಚಿನವುಗಳು", hi: "पसंदीदा" },
  "account": { kn: "ಖಾತೆ", hi: "खाता" },
  "orders": { kn: "ಆರ್ಡರ್‌ಗಳು", hi: "आदेश" },
  "order": { kn: "ಆರ್ಡರ್", hi: "आदेश" },
  "login": { kn: "ಲಾಗಿನ್", hi: "लॉग इन" },
  "logout": { kn: "ಲಾಗ್‌ಔಟ್", hi: "लॉग आउट" },
  "search": { kn: "ಹುಡುಕಿ", hi: "खोजें" },
  "filter": { kn: "ಫಿಲ್ಟರ್", hi: "फ़िल्टर" },
  "filters": { kn: "ಫಿಲ್ಟರ್‌ಗಳು", hi: "फ़िल्टर" },
  "sort": { kn: "ವಿಂಗಡಿಸಿ", hi: "क्रमबद्ध" },
  "curated": { kn: "ಆಯ್ಕೆಮಾಡಿದ", hi: "क्यूरेटेड" },
  "display": { kn: "ಪ್ರದರ್ಶನ", hi: "प्रदर्शन" },
  "price": { kn: "ಬೆಲೆ", hi: "मूल्य" },
  "fair": { kn: "ನ್ಯಾಯಯುತ", hi: "उचित" },
  "free": { kn: "ಉಚಿತ", hi: "मुफ़्त" },
  "total": { kn: "ಒಟ್ಟು", hi: "कुल" },
  "subtotal": { kn: "ಉಪಮೊತ್ತ", hi: "उप-योग" },
  "taxes": { kn: "ತೆರಿಗೆಗಳು", hi: "कर" },
  "tax": { kn: "ತೆರಿಗೆ", hi: "कर" },
  "gst": { kn: "ಜಿಎಸ್‌ಟಿ", hi: "जीएसटी" },
  "fee": { kn: "ಶುಲ್ಕ", hi: "शुल्क" },
  "fees": { kn: "ಶುಲ್ಕಗಳು", hi: "शुल्क" },
  "payout": { kn: "ಪಾವತಿ", hi: "भुगतान" },
  "earnings": { kn: "ಗಳಿಕೆ", hi: "कमाई" },
  "earned": { kn: "ಗಳಿಸಲಾಗಿದೆ", hi: "अर्जित" },
  "month": { kn: "ತಿಂಗಳು", hi: "महीना" },
  "months": { kn: "ತಿಂಗಳುಗಳು", hi: "महीने" },
  "year": { kn: "ವರ್ಷ", hi: "वर्ष" },
  "years": { kn: "ವರ್ಷಗಳು", hi: "वर्ष" },
  "day": { kn: "ದಿನ", hi: "दिन" },
  "days": { kn: "ದಿನಗಳು", hi: "दिन" },
  "hours": { kn: "ಗಂಟೆಗಳು", hi: "घंटे" },
  "hour": { kn: "ಗಂಟೆ", hi: "घंटा" },
  "weeks": { kn: "ವಾರಗಳು", hi: "सप्ताह" },
  "week": { kn: "ವಾರ", hi: "सप्ताह" },
  "save": { kn: "ಉಳಿಸಿ", hi: "सहेजें" },
  "saved": { kn: "ಉಳಿಸಲಾಗಿದೆ", hi: "सहेजा गया" },
  "share": { kn: "ಹಂಚಿಕೊಳ್ಳಿ", hi: "साझा करें" },
  "add": { kn: "ಸೇರಿಸಿ", hi: "जोड़ें" },
  "added": { kn: "ಸೇರಿಸಲಾಗಿದೆ", hi: "जोड़ा गया" },
  "remove": { kn: "ತೆಗೆದುಹಾಕಿ", hi: "हटाएं" },
  "view": { kn: "ನೋಡಿ", hi: "देखें" },
  "inspect": { kn: "ವೀಕ್ಷಿಸಿ", hi: "निरीक्षण करें" },
  "explore": { kn: "ಅನ್ವೇಷಿಸಿ", hi: "अन्वेषण करें" },
  "discover": { kn: "ತಿಳಿದುಕೊಳ್ಳಿ", hi: "खोजें" },
  "enter": { kn: "ಪ್ರವೇಶಿಸಿ", hi: "प्रवेश करें" },
  "submit": { kn: "ಸಲ್ಲಿಸಿ", hi: "जमा करें" },
  "send": { kn: "ಕಳುಹಿಸಿ", hi: "भेजें" },
  "close": { kn: "ಮುಚ್ಚಿ", hi: "बंद करें" },
  "back": { kn: "ಹಿಂದಕ್ಕೆ", hi: "वापस" },
  "next": { kn: "ಮುಂದೆ", hi: "आगे" },
  "continue": { kn: "ಮುಂದುವರಿಸಿ", hi: "जारी रखें" },
  "cancel": { kn: "ರದ್ದುಮಾಡಿ", hi: "रद्द करें" },
  "confirm": { kn: "ದೃಢೀಕರಿಸಿ", hi: "पुष्टि करें" },
  "clear": { kn: "ತೆರವುಗೊಳಿಸಿ", hi: "साफ़ करें" },
  "checkout": { kn: "ಖರೀದಿ ಪೂರ್ಣಗೊಳಿಸಿ", hi: "चेकआउट" },
  "buy": { kn: "ಖರೀದಿಸಿ", hi: "खरीदें" },
  "status": { kn: "ಸ್ಥಿತಿ", hi: "स्थिति" },
  "actions": { kn: "ಕ್ರಿಯೆಗಳು", hi: "क्रियाएं" },
  "inventory": { kn: "ದಾಸ್ತಾನು", hi: "सूची" },
  "settings": { kn: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", hi: "सेटिंग्स" },
  "profile": { kn: "ವಿವರ", hi: "प्रोफ़ाइल" },
  "help": { kn: "ಸಹಾಯ", hi: "मदद" },
  "support": { kn: "ಬೆಂಬಲ", hi: "सहायता" },
  "contact": { kn: "ಸಂಪರ್ಕಿಸಿ", hi: "संपर्क" },
  "phone": { kn: "ದೂರವಾಣಿ", hi: "फ़ोन" },
  "name": { kn: "ಹೆಸರು", hi: "नाम" },
  "language": { kn: "ಭಾಷೆ", hi: "भाषा" },
  "rating": { kn: "ರೇಟಿಂಗ್", hi: "रेटिंग" },
  "ratings": { kn: "ರೇಟಿಂಗ್‌ಗಳು", hi: "रेटिंग्स" },
  "reviews": { kn: "ವಿಮರ್ಶೆಗಳು", hi: "समीक्षाएं" },
  "review": { kn: "ವಿಮರ್ಶೆ", hi: "समीक्षा" },
  "stars": { kn: "ನಕ್ಷತ್ರಗಳು", hi: "सितारे" },
  "star": { kn: "ನಕ್ಷತ್ರ", hi: "सितारा" },
  "cm": { kn: "ಸೆಂ.ಮೀ", hi: "सेमी" },
  "mm": { kn: "ಮಿ.ಮೀ", hi: "मिमी" },
  "kg": { kn: "ಕಿ.ಗ್ರಾಂ", hi: "किग्रा" },
  "grams": { kn: "ಗ್ರಾಂ", hi: "ग्राम" },
  "inches": { kn: "ಇಂಚುಗಳು", hi: "इंच" },
  "inch": { kn: "ಇಂಚು", hi: "इंच" },
  "roughly": { kn: "ಸರಿಸುಮಾರು", hi: "लगभग" },

  // Craft Disciplines & Materials
  "paintings": { kn: "ಚಿತ್ರಕಲೆಗಳು", hi: "चित्रकला" },
  "painting": { kn: "ವರ್ಣಚಿತ್ರ", hi: "चित्र" },
  "ceramics": { kn: "ಪಿಂಗಾಣಿ ಕಲೆ", hi: "मिट्टी शिल्प" },
  "ceramic": { kn: "ಪಿಂಗಾಣಿ", hi: "सिरेमिक" },
  "textiles": { kn: "ವಸ್ತ್ರ ಕಲೆ", hi: "वस्त्र शिल्प" },
  "textile": { kn: "ವಸ್ತ್ರ", hi: "वस्त्र" },
  "silks": { kn: "ರೇಷ್ಮೆಗಳು", hi: "सिल्क" },
  "metalcraft": { kn: "ಲೋಹ ಕಲೆ", hi: "धातु शिल्प" },
  "metal": { kn: "ಲೋಹ", hi: "धातु" },
  "woodcraft": { kn: "ಮರದ ಕೆತ್ತನೆ", hi: "काष्ठ शिल्प" },
  "wood": { kn: "ಮರ", hi: "लकड़ी" },
  "jewellery": { kn: "ಆಭರಣಗಳು", hi: "आभूषण" },
  "pottery": { kn: "ಮಣ್ಣಿನ ಮಡಕೆ ಕಲೆ", hi: "कुम्हारी" },
  "silk": { kn: "ರೇಷ್ಮೆ", hi: "रेशम" },
  "cotton": { kn: "ಹತ್ತಿ", hi: "कपास" },
  "wool": { kn: "ಉಣ್ಣೆ", hi: "ऊन" },
  "brass": { kn: "ಹಿತ್ತಾಳೆ", hi: "पीतल" },
  "bronze": { kn: "ಕಂಚು", hi: "कांस्य" },
  "copper": { kn: "ತಾಮ್ರ", hi: "तांबा" },
  "clay": { kn: "ಮಣ್ಣು", hi: "चिकनी मिट्टी" },
  "terracotta": { kn: "ಟೆರ್ರಾಕೋಟಾ", hi: "टेराकोटा" },
  "gold": { kn: "ಚಿನ್ನದ", hi: "स्वर्ण" },
  "silver": { kn: "ಬೆಳ್ಳಿಯ", hi: "रजत" },
  "bull": { kn: "ನಂದಿ ವೃಷಭ", hi: "नंदी" },
  "horse": { kn: "ಕುದುರೆ", hi: "घोड़ा" },
  "elephant": { kn: "ಆನೆ", hi: "हाथी" },
  "peacock": { kn: "ನವಿಲು", hi: "मोर" },
  "saree": { kn: "ಸೀರೆ", hi: "साड़ी" },
  "dupatta": { kn: "ದುಪಟ್ಟಾ", hi: "दुपट्टा" },
  "urn": { kn: "ಹೂದಾನಿ", hi: "कलश" },
  "vase": { kn: "ಹೂದಾನಿ", hi: "फूलदान" },
  "totem": { kn: "ಶಿಲ್ಪ", hi: "प्रतिमा" },
  "sculpture": { kn: "ಶಿಲ್ಪಕಲೆ", hi: "मूर्तिकला" },
  "choker": { kn: "ಕಂಠಹಾರ", hi: "कंठा" },
  "amulet": { kn: "ಪದಕ", hi: "ताबीज़" },
  "spire": { kn: "ಗೋಪುರ", hi: "शिखर" },
  "temple": { kn: "ದೇವಾಲಯ", hi: "मंदिर" },
  "avian": { kn: "ಪಕ್ಷಿ", hi: "पक्षी" },
  "harmony": { kn: "ಸಾಮರಸ್ಯ", hi: "सामंजस्य" },
  "motif": { kn: "ವಿನ್ಯಾಸ", hi: "रूपांकन" },
  "motifs": { kn: "ವಿನ್ಯಾಸಗಳು", hi: "रूपांकन" },
  "embroidered": { kn: "ಕಸೂತಿ ಮಾಡಿದ", hi: "कढ़ाईदार" },
  "embroidery": { kn: "ಕಸೂತಿ", hi: "कढ़ाई" },
  "lacquer": { kn: "ನೈಸರ್ಗಿಕ ಅರಗು", hi: "लाख" },
  "zari": { kn: "ಜರಿ", hi: "जरी" },
  "brocade": { kn: "ಬ್ರೊಕೇಡ್", hi: "किमख़ाब" },
  "materials": { kn: "ಸಾಮಗ್ರಿಗಳು", hi: "सामग्री" },
  "technique": { kn: "ತಂತ್ರಜ್ಞಾನ", hi: "तकनीक" },
  "dimensions": { kn: "ಆಯಾಮಗಳು", hi: "विमाएं" },
  "weight": { kn: "ತೂಕ", hi: "वजन" },
  "category": { kn: "ವರ್ಗ", hi: "श्रेणी" },
  "categories": { kn: "ವರ್ಗಗಳು", hi: "श्रेणियां" },
  "origin": { kn: "ಮೂಲ", hi: "मूल" },
  "region": { kn: "ಪ್ರದೇಶ", hi: "क्षेत्र" },
  "state": { kn: "ರಾಜ್ಯ", hi: "राज्य" },
  "lineage": { kn: "ಪರಂಪರೆ", hi: "वंशावली" },
  "provenance": { kn: "ಮೂಲ ಇತಿಹಾಸ", hi: "प्रामाणिकता" },
  "heritage": { kn: "ಪರಂಪರೆ", hi: "विरासत" },
  "masterpiece": { kn: "ಶ್ರೇಷ್ಠ ಕಲಾಕೃತಿ", hi: "उत्कृष्ट कृति" },
  "masterpieces": { kn: "ಶ್ರೇಷ್ಠ ಕೃತಿಗಳು", hi: "उत्कृष्ट कृतियां" },
  "heirloom": { kn: "ಪಾರಂಪರಿಕ ಕೃತಿ", hi: "धरोहर" },
  "heirlooms": { kn: "ಪಾರಂಪರಿಕ ಆಸ್ತಿಗಳು", hi: "धरोहरें" },
  "tradition": { kn: "ಸಂಪ್ರದಾಯ", hi: "परंपरा" },
  "traditions": { kn: "ಸಂಪ್ರದಾಯಗಳು", hi: "परंपराएं" },
  "authentic": { kn: "ಅಧಿಕೃತ", hi: "प्रामाणिक" },
  "handmade": { kn: "ಕೈಯಿಂದ ಮಾಡಿದ", hi: "हस्तनिर्मित" },
  "handwoven": { kn: "ಕೈಮಗ್ಗದ", hi: "हथकरघा" },
  "handcrafted": { kn: "ಕರಕುಶಲ", hi: "हस्तशिल्प" },
  "natural": { kn: "ನೈಸರ್ಗಿಕ", hi: "प्राकृतिक" },
  "pure": { kn: "ಶುದ್ಧ", hi: "शुद्ध" },
  "organic": { kn: "ಸಾವಯವ", hi: "जैविक" },

  // Geography & Regions
  "india": { kn: "ಭಾರತ", hi: "भारत" },
  "karnataka": { kn: "ಕರ್ನಾಟಕ", hi: "कर्नाटक" },
  "bastar": { kn: "ಬಸ್ತಾರ್", hi: "बस्तर" },
  "chhattisgarh": { kn: "ಛತ್ತೀಸ್‌ಗಢ", hi: "छत्तीसगढ़" },
  "rajasthan": { kn: "ರಾಜಸ್ಥಾನ", hi: "राजस्थान" },
  "jaipur": { kn: "ಜೈಪುರ", hi: "जयपुर" },
  "channapatna": { kn: "ಚನ್ನಪಟ್ಟಣ", hi: "चन्नपटना" },
  "kangra": { kn: "ಕಾಂಗ್ರಾ", hi: "कांगड़ा" },
  "himachal": { kn: "ಹಿಮಾಚಲ", hi: "हिमाचल" },
  "ilkal": { kn: "ಇಳಕಲ್", hi: "इल्कल" },
  "dharwad": { kn: "ಧಾರವಾಡ", hi: "धारवाड़" },
  "chanderi": { kn: "ಚಂದೇರಿ", hi: "चंदेरी" },

  // Financial & Units
  "lakhs": { kn: "ಲಕ್ಷಗಳು", hi: "लाख" },
  "lakh": { kn: "ಲಕ್ಷ", hi: "लाख" },
  "crores": { kn: "ಕೋಟಿಗಳು", hi: "करोड़" },
  "crore": { kn: "ಕೋಟಿ", hi: "करोड़" },
  "thousand": { kn: "ಸಾವಿರ", hi: "हज़ार" },
  "hundred": { kn: "ನೂರು", hi: "सौ" },
  "budget": { kn: "ಬಜೆಟ್", hi: "बजट" },
  "escrow": { kn: "ಎಸ್ಕ್ರೋ ರಕ್ಷಣೆ", hi: "एस्क्रो सुरक्षा" },
  "middleman": { kn: "ಮಧ್ಯವರ್ತಿ", hi: "बिचौलिया" },
  "middlemen": { kn: "ಮಧ್ಯವರ್ತಿಗಳು", hi: "बिचौलिए" },
  "trader": { kn: "ವ್ಯಾಪಾರಿ", hi: "व्यापारी" },
  "guild": { kn: "ಕಲಾ ಸಂಘ", hi: "शिल्प संघ" },
  "cluster": { kn: "ಕ್ಲಸ್ಟರ್", hi: "संकुल" },
  "clusters": { kn: "ಕ್ಲಸ್ಟರ್‌ಗಳು", hi: "संकुल" },
  "love": { kn: "ಪ್ರೀತಿ", hi: "प्रेम" },
  "care": { kn: "ಕಾಳಜಿ", hi: "देखभाल" },
  "wholesale": { kn: "ಸಗಟು", hi: "थोक" },
  "retail": { kn: "ಚಿಲ್ಲರೆ", hi: "खुदरा" },
  "direct": { kn: "ನೇರ", hi: "प्रत्यक्ष" },
  "straight": { kn: "ನೇರವಾಗಿ", hi: "सीधे" },
  "uplift": { kn: "ಏರಿಕೆ", hi: "वृद्धि" },
  "impact": { kn: "ಪ್ರಭಾವ", hi: "प्रभाव" },
  "verified": { kn: "ದೃಢೀಕೃತ", hi: "सत्यापित" },
  "certified": { kn: "ಪ್ರಮಾಣೀಕೃತ", hi: "प्रमाणित" },

  // Grammar & Connecting Words
  "and": { kn: "ಮತ್ತು", hi: "और" },
  "or": { kn: "ಅಥವಾ", hi: "या" },
  "with": { kn: "ಜೊತೆಗೆ", hi: "साथ" },
  "by": { kn: "ಮೂಲಕ", hi: "द्वारा" },
  "for": { kn: "ಗಾಗಿ", hi: "के लिए" },
  "from": { kn: "ಇಂದ", hi: "से" },
  "to": { kn: "ಗೆ", hi: "तक" },
  "in": { kn: "ನಲ್ಲಿ", hi: "में" },
  "on": { kn: "ಮೇಲೆ", hi: "पर" },
  "at": { kn: "ರಲ್ಲಿ", hi: "पर" },
  "across": { kn: "ಅಂತರ್ಗತವಾಗಿ", hi: "भर में" },
  "through": { kn: "ಮೂಲಕ", hi: "के माध्यम से" },
  "under": { kn: "ಅಡಿಯಲ್ಲಿ", hi: "के तहत" },
  "over": { kn: "ಹೆಚ್ಚು", hi: "से अधिक" },
  "versus": { kn: "ಬದಲಿಗೆ", hi: "बनाम" },
  "all": { kn: "ಎಲ್ಲಾ", hi: "सभी" },
  "each": { kn: "ಪ್ರತಿಯೊಂದು", hi: "प्रत्येक" },
  "every": { kn: "ಪ್ರತಿ", hi: "हर" },
  "both": { kn: "ಎರಡೂ", hi: "दोनों" },
  "more": { kn: "ಹೆಚ್ಚು", hi: "अधिक" },
  "less": { kn: "ಕಡಿಮೆ", hi: "कम" },
  "average": { kn: "ಸರಾಸರಿ", hi: "औसत" },
  "new": { kn: "ಹೊಸ", hi: "नया" },
  "active": { kn: "ಸಕ್ರಿಯ", hi: "सक्रिय" },
  "best": { kn: "ಅತ್ಯುತ್ತಮ", hi: "सर्वोत्तम" },
  "great": { kn: "ಶ್ರೇಷ್ಠ", hi: "महान" },
  "good": { kn: "ಉತ್ತಮ", hi: "अच्छा" },
  "high": { kn: "ಹೆಚ್ಚು", hi: "उच्च" },
  "low": { kn: "ಕಡಿಮೆ", hi: "कम" },
  "living": { kn: "ಜೀವಂತ", hi: "जीवंत" },
  "story": { kn: "ಕಥೆ", hi: "कहानी" },
  "voice": { kn: "ಧ್ವನಿ", hi: "वाणी" },
  "piece": { kn: "ಕಲಾಕೃತಿ", hi: "कृति" },
  "pieces": { kn: "ಕಲಾಕೃತಿಗಳು", hi: "कृतियां" },
  "item": { kn: "ವಸ್ತು", hi: "वस्तु" },
  "items": { kn: "ವಸ್ತುಗಳು", hi: "वस्तुएं" },
  "product": { kn: "ಉತ್ಪನ್ನ", hi: "उत्पाद" },
  "products": { kn: "ಉತ್ಪನ್ನಗಳು", hi: "उत्पाद" },
  "page": { kn: "ಪುಟ", hi: "पृष्ठ" },
  "pages": { kn: "ಪುಟಗಳು", hi: "पृष्ठ" },
  "showing": { kn: "ತೋರಿಸಲಾಗುತ್ತಿದೆ", hi: "दिखाया जा रहा है" },
  "results": { kn: "ಫಲಿತಾಂಶಗಳು", hi: "परिणाम" },
  "found": { kn: "ಕಂಡುಬಂದಿದೆ", hi: "पाया गया" },
  "matching": { kn: "ಹೊಂದುವಂತಹ", hi: "अनुरूप" },
  "criteria": { kn: "ಮಾನದಂಡ", hi: "मानदंड" },
  "empty": { kn: "ಖಾಲಿ", hi: "खाली" },
  "no": { kn: "ಯಾವುದೇ ಇಲ್ಲ", hi: "कोई नहीं" },
  "not": { kn: "ಅಲ್ಲ", hi: "नहीं" },
  "your": { kn: "ನಿಮ್ಮ", hi: "आपका" },
  "our": { kn: "ನಮ್ಮ", hi: "हमारा" },
  "their": { kn: "ಅವರ", hi: "उनका" },
  "my": { kn: "ನನ್ನ", hi: "मेरा" },
  "you": { kn: "ನೀವು", hi: "आप" },
  "we": { kn: "ನಾವು", hi: "हम" },
  "this": { kn: "ಈ", hi: "इस" },
  "that": { kn: "ಆ", hi: "उस" },
  "these": { kn: "ಇವು", hi: "ये" },
  "those": { kn: "ಅವು", hi: "वे" },
  "a": { kn: "ಒಂದು", hi: "एक" },
  "an": { kn: "ಒಂದು", hi: "एक" },
  "the": { kn: "", hi: "" },
  "is": { kn: "ಆಗಿದೆ", hi: "है" },
  "are": { kn: "ಆಗಿವೆ", hi: "हैं" },
  "was": { kn: "ಆಗಿತ್ತು", hi: "था" },
  "were": { kn: "ಆಗಿದ್ದವು", hi: "थे" },
  "of": { kn: "ರ", hi: "का" }
};

// ── Indic Syllabic Transliteration Table for Unmapped Words ─────────────────
// Ensures that unknown English words (names, rare terms) are rendered accurately
// in native script rather than remaining untranslated.
const TRANSLITERATION_MAP_KN: Array<[RegExp, string]> = [
  [/bastar/gi, "ಬಸ್ತಾರ್"],
  [/dhokra/gi, "ಧೋಕ್ರಾ"],
  [/chanderi/gi, "ಚಂದೇರಿ"],
  [/pahari/gi, "ಪಹಾಡಿ"],
  [/jaipur/gi, "ಜೈಪುರ"],
  [/channapatna/gi, "ಚನ್ನಪಟ್ಟಣ"],
  [/kundan/gi, "ಕುಂದನ್"],
  [/meenakari/gi, "ಮೀನಾಕಾರಿ"],
  [/kasuti/gi, "ಕಸೂತಿ"],
  [/ilkal/gi, "ಇಳಕಲ್"],
  [/kaarigar/gi, "ಕಾರೀಗರ್"],
  [/nandi/gi, "ನಂದಿ"],
  [/khadi/gi, "ಖಾದಿ"],
  [/zari/gi, "ಜರಿ"],
  [/dupatta/gi, "ದುಪಟ್ಟಾ"],
  [/saree/gi, "ಸೀರೆ"],
  [/shg/gi, "ಸ್ವಸಹಾಯ ಸಂಘ"],
  [/gi/gi, "ಜಿಐ"],
  [/up/gi, "ಯುಪಿ"],
  [/mp/gi, "ಎಂಪಿ"],
  [/upi/gi, "ಯುಪಿಐ"],
  [/tion/gi, "ಶನ್"],
  [/ing/gi, "ಇಂಗ್"],
  [/ee/gi, "ಈ"],
  [/oo/gi, "ಊ"],
  [/ou/gi, "ಔ"],
  [/ai/gi, "ಐ"],
  [/sh/gi, "ಶ"],
  [/th/gi, "ಥ"],
  [/ch/gi, "ಚ"],
  [/ph/gi, "ಫ"],
  [/bh/gi, "ಭ"],
  [/dh/gi, "ಧ"],
  [/gh/gi, "ಘ"],
  [/kh/gi, "ಖ"],
  [/jh/gi, "ಝ"],
  [/wh/gi, "ವ"],
  [/ck/gi, "ಕ್"],
  [/b/gi, "ಬ"],
  [/c/gi, "ಕ"],
  [/d/gi, "ದ"],
  [/f/gi, "ಫ"],
  [/g/gi, "ಗ"],
  [/h/gi, "ಹ"],
  [/j/gi, "ಜ"],
  [/k/gi, "ಕ"],
  [/l/gi, "ಲ"],
  [/m/gi, "ಮ"],
  [/n/gi, "ನ"],
  [/p/gi, "ಪ"],
  [/q/gi, "ಕ"],
  [/r/gi, "ರ"],
  [/s/gi, "ಸ"],
  [/t/gi, "ತ"],
  [/v/gi, "ವ"],
  [/w/gi, "ವ"],
  [/x/gi, "ಕ್ಸ್"],
  [/y/gi, "ಯ"],
  [/z/gi, "ಝ"],
  [/a/gi, "ಅ"],
  [/e/gi, "ಎ"],
  [/i/gi, "ಇ"],
  [/o/gi, "ಒ"],
  [/u/gi, "ಉ"]
];

const TRANSLITERATION_MAP_HI: Array<[RegExp, string]> = [
  [/bastar/gi, "बस्तर"],
  [/dhokra/gi, "ढोकरा"],
  [/chanderi/gi, "चंदेरी"],
  [/pahari/gi, "पहाड़ी"],
  [/jaipur/gi, "जयपुर"],
  [/channapatna/gi, "चन्नपटना"],
  [/kundan/gi, "कुंदन"],
  [/meenakari/gi, "मीनाकारी"],
  [/kasuti/gi, "कसूती"],
  [/ilkal/gi, "इल्कल"],
  [/kaarigar/gi, "कारीगर"],
  [/nandi/gi, "नंदी"],
  [/khadi/gi, "खादी"],
  [/zari/gi, "जरी"],
  [/dupatta/gi, "दुपट्टा"],
  [/saree/gi, "साड़ी"],
  [/shg/gi, "एसएचजी"],
  [/gi/gi, "जीआई"],
  [/up/gi, "यूपी"],
  [/mp/gi, "एमपी"],
  [/upi/gi, "यूपीआई"],
  [/tion/gi, "शन"],
  [/ing/gi, "इंग"],
  [/ee/gi, "ई"],
  [/oo/gi, "ऊ"],
  [/ou/gi, "औ"],
  [/ai/gi, "ऐ"],
  [/sh/gi, "श"],
  [/th/gi, "थ"],
  [/ch/gi, "च"],
  [/ph/gi, "फ"],
  [/bh/gi, "भ"],
  [/dh/gi, "ध"],
  [/gh/gi, "घ"],
  [/kh/gi, "ख"],
  [/jh/gi, "झ"],
  [/wh/gi, "व"],
  [/ck/gi, "क"],
  [/b/gi, "ब"],
  [/c/gi, "क"],
  [/d/gi, "द"],
  [/f/gi, "फ़"],
  [/g/gi, "ग"],
  [/h/gi, "ह"],
  [/j/gi, "ज"],
  [/k/gi, "क"],
  [/l/gi, "ल"],
  [/m/gi, "म"],
  [/n/gi, "न"],
  [/p/gi, "प"],
  [/q/gi, "क"],
  [/r/gi, "र"],
  [/s/gi, "स"],
  [/t/gi, "त"],
  [/v/gi, "व"],
  [/w/gi, "व"],
  [/x/gi, "क्स"],
  [/y/gi, "य"],
  [/z/gi, "ज़"],
  [/a/gi, "अ"],
  [/e/gi, "ए"],
  [/i/gi, "इ"],
  [/o/gi, "ओ"],
  [/u/gi, "उ"]
];

function transliterateWord(word: string, targetLang: 'kn' | 'hi'): string {
  let result = word;
  const map = targetLang === 'kn' ? TRANSLITERATION_MAP_KN : TRANSLITERATION_MAP_HI;
  for (const [regex, replacement] of map) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Translates a single word or returns translated term from dictionary.
 * Numbers and special characters are bypassed before reaching here.
 */
function translateWord(rawWord: string, targetLang: 'kn' | 'hi'): string {
  const lower = rawWord.toLowerCase();
  
  // 1. Direct dictionary match
  const match = WORD_DICTIONARY[lower];
  if (match && match[targetLang]) {
    return match[targetLang];
  }

  // 2. Transliteration for names / unmapped words
  return transliterateWord(rawWord, targetLang);
}

/**
 * Main Text Translation Function.
 * Strictly preserves:
 * - Numbers (e.g. 148+, ₹42.8 Lakhs, +280%, ₹18,400, 92%, 123456, 25, 50, 45 x 30)
 * - Special characters (₹, $, %, +, -, *, /, =, ✦, ·, 👁, 📍, 💡, ✓, ★, —, &, |, !, ?, etc.)
 * Only translates alphabetic word tokens.
 */
export function translateText(text: string, targetLang: SupportedLanguage): string {
  if (!text || targetLang === 'en' || typeof text !== 'string') {
    return text;
  }

  // Phase 1: Match multi-word phrases greedily first
  let processed = text;
  // Sort phrases by descending length so longer phrases match first
  const phraseKeys = Object.keys(PHRASE_DICTIONARY).sort((a, b) => b.length - a.length);
  
  for (const phrase of phraseKeys) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(processed)) {
      const translation = PHRASE_DICTIONARY[phrase][targetLang];
      processed = processed.replace(regex, translation);
    }
  }

  // Phase 2: Translate ampersand '&' into target language conjunction
  if (targetLang === 'kn') {
    processed = processed.replace(/(?<=\s)&(?=\s)|(?<=\s)&amp;(?=\s)|^&(?=\s)|(?<=\s)&$|&amp;/g, 'ಮತ್ತು');
  } else if (targetLang === 'hi') {
    processed = processed.replace(/(?<=\s)&(?=\s)|(?<=\s)&amp;(?=\s)|^&(?=\s)|(?<=\s)&$|&amp;/g, 'और');
  }

  // Phase 3: Tokenize by separating Words from Numbers & Special Characters
  // Regex splits on alphabetic word sequences vs non-word tokens (digits, punctuation, symbols, whitespace)
  return processed.replace(/[A-Za-z\u00C0-\u024F]+/g, (match, offset, str) => {
    // If it's a dimensional 'x' or 'X' surrounded by digits, preserve it
    if ((match === 'x' || match === 'X') && /\d\s*$/.test(str.slice(0, offset)) && /^\s*\d/.test(str.slice(offset + 1))) {
      return match;
    }
    if (!match.trim()) return match;
    return translateWord(match, targetLang);
  });
}

// ── DOM Translation Engine (Realtime Mutation Observer) ──────────────────────

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

  // Retrieve or record original English text
  let original = originalTextMap.get(node);
  if (original === undefined) {
    original = currentVal;
    originalTextMap.set(node, original);
  }

  // Only translate if original contains letters
  if (!/[A-Za-z]/.test(original)) {
    return;
  }

  const newVal = lang === 'en' ? original : translateText(original, lang);
  if (node.nodeValue !== newVal) {
    node.nodeValue = newVal;
  }
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
      elem.placeholder = lang === 'en' ? origPlaceholder : translateText(origPlaceholder, lang);
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
      elem.setAttribute('title', lang === 'en' ? origTitle : translateText(origTitle, lang));
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

  // Create persistent MutationObserver to translate dynamically rendered components
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
