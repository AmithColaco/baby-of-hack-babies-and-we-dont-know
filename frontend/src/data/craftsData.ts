import type { CraftObject, StoryArticle } from '../types';

export const CRAFT_OBJECTS: CraftObject[] = [
  {
    id: 'pahari-miniature',
    accessionNo: 'KG-2026-01',
    romanNumeral: 'I',
    title: 'Radha & Krishna in the Groves of Kangra',
    vernacularTitle: 'काँगड़ा लघु चित्रकला',
    craftTradition: 'Pahari Miniature Painting',
    category: 'paintings',
    artisan: 'Pandit Ram Swaroop Sharma',
    artisanTitle: 'National Master Artist · 4th Generation Wasli Painter',
    atelier: 'Chamba-Kangra Parampara Gurukulam',
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    period: 'Circa 1780 revival · Kangra Kalam',
    price: 48500,
    currency: 'INR',
    availability: 'Available',
    dimensions: '28.5 cm × 21.0 cm (Framed: 42 cm × 34 cm)',
    weight: '1.4 kg (Teak & Glass Mount)',
    materials: [
      'Handmade Wasli Paper (Rice straw & sun-dried cotton)',
      'Lapis Lazuli (Natural Afghan Ultramarine)',
      'Malachite (Deep mineral green)',
      'Cinnabar (Vermilion mercuric sulphide)',
      '24K Beaten Gold Leaf (Varq illumination)',
      'Single-hair Himalayan squirrel tail brush'
    ],
    technique: 'Single-hair lining (kalam-kaari), agate stone burnishing (ghontai), natural gum acacia binding',
    image: '/images/pahari.jpg',
    makingStory: {
      summary: 'Created over 140 meticulous hours in the high valley of Kangra, this miniature follows the late-18th century Gita Govinda lineage where spiritual devotion is rendered through hyper-detailed flora and lyrical color harmony.',
      stages: [
        {
          step: '01',
          title: 'Wasli Paper Preparation & Agate Burnishing',
          description: 'Three gossamer layers of acid-free handmade paper are laminated with rice-starch paste, sun-baked against marble slabs, and burnished with a heated agate stone until the surface resembles polished ivory.'
        },
        {
          step: '02',
          title: 'Mineral Pigment Alchemy',
          description: 'Raw gemstones—lapis lazuli, malachite, yellow peori, and burnt conch shell—are hand-ground in granite mortars with mountain spring water and acacia tree gum for 12 hours.'
        },
        {
          step: '03',
          title: 'Squirrel-Hair Kalam Illumination',
          description: 'Using a bespoke brush assembled with a single hair plucked from the throat of a mountain squirrel, the artisan draws micro-foliage and applies 24K beaten gold foil to jewelry and drapery.'
        }
      ]
    },
    artisanBio: 'Pandit Ram Swaroop Sharma preserves the sacred Kangra Kalam passed down through four generations in Himachal Pradesh. His works reside in the Victoria & Albert Museum and private collections worldwide.',
    artisanQuote: 'In Kangra painting, we do not paint with the brush; we breathe through the squirrel hair onto the wasli. When the stone burnishes the paper, the light wakes up.',
    artisanImage: '/images/artisan.jpg',
    directArtisanSharePercent: 88,
    position3D: [-5.2, 0.2, -1.0],
    rotation3D: [0, 0.25, 0],
    scale3D: [1, 1, 1],
    modelType: 'painting',
    colorPalette: ['#1C2E4A', '#E2A838', '#8A2D23', '#2D5A3A'],
    isWomenSHG: false,
    materialCost: 12500,
    laborHours: 140,
    skillRatePerHour: 220,
    heritagePremium: 5200,
    machineLookalikePrice: 1200,
    machineLookalikeNotes: 'Digital offset prints on textured cardstock mimic mineral tone, but lack natural gemstone refraction, agate burnish, and 24K real gold leaf illumination.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/temple_bell_and_flute.ogg',
    processPhotos: ['/images/pahari.jpg', '/images/artisan.jpg']
  },
  {
    id: 'jaipur-blue-pottery',
    accessionNo: 'KG-2026-02',
    romanNumeral: 'II',
    title: 'Cobalt Meena Arabesque Urn',
    vernacularTitle: 'जयपुर नीली मृद्भाण्ड',
    craftTradition: 'Jaipur Blue Pottery',
    category: 'ceramics',
    artisan: 'Mahesh Kumar & Sanganer Guild',
    artisanTitle: 'Master Ceramist · UNESCO Seal of Excellence',
    atelier: 'Kripal Kumbh Heritage Atelier',
    region: 'Sanganer, Jaipur',
    state: 'Rajasthan',
    period: 'Turko-Persian Glazed Faience Lineage',
    price: 24000,
    currency: 'INR',
    availability: 'Available',
    dimensions: '38.0 cm Height × 22.5 cm Diameter',
    weight: '3.6 kg',
    materials: [
      'Ground Quartz Rock (70%)',
      'Cullet / Recycled Glass Powder (15%)',
      'Katira Gond (Natural plant gum)',
      'Multani Mitti (Fuller’s earth 5%)',
      'Cobalt Oxide & Copper Carbonate Pigments',
      'Low-fire Borax & Feldspar Glaze'
    ],
    technique: 'Non-clay dough molding, freehand oxide brushwork, single wood-fired kiln firing at 850°C',
    image: '/images/bluepottery.jpg',
    makingStory: {
      summary: 'Unlike conventional earthenware, Jaipur Blue Pottery contains zero clay. Molded entirely from crushed quartz stone and glass, each urn is hand-painted with cobalt arabesques that mirror Persian floral tilework brought to the courts of Amer.',
      stages: [
        {
          step: '01',
          title: 'Quartz Dough Compounding',
          description: 'White quartz stones from the Aravalli hills are crushed into powder, blended with pulverized glass, sajji (natural soda ash), and gum to form a delicate, clay-free paste.'
        },
        {
          step: '02',
          title: 'Open Mold Forming & Smoothening',
          description: 'The paste is pressed into two-part terracotta open molds and filled with sieved burnt wood ash to maintain internal form as it cures in dry desert sunlight.'
        },
        {
          step: '03',
          title: 'Cobalt & Copper Freehand Inscription',
          description: 'Once smoothed with river stones, the artisan outlines arabesque palmettes with cobalt oxide using soft camel hair brushes, coated with translucent borax glaze, and fired in a slow kiln.'
        }
      ]
    },
    artisanBio: 'Trained under the legendary Padma Shri Kripal Singh Shekhawat, Mahesh Kumar has spent 32 years reviving historical 17th-century glaze recipes that resist cracking under tropical climates.',
    artisanQuote: 'Our pottery does not come from earth; it is born of quartz crystal and glass. What shines blue is not paint, but fire reacting with cobalt metal.',
    artisanImage: '/images/artisan_potter.jpg',
    directArtisanSharePercent: 85,
    position3D: [-3.1, 0.1, 0.4],
    rotation3D: [0, -0.15, 0],
    scale3D: [1, 1, 1],
    modelType: 'pottery',
    colorPalette: ['#0A4275', '#1EA5C4', '#FAF7F2', '#EBB036'],
    isWomenSHG: false,
    materialCost: 4800,
    laborHours: 64,
    skillRatePerHour: 240,
    heritagePremium: 3840,
    machineLookalikePrice: 850,
    machineLookalikeNotes: 'Machine-pressed clay ceramics coated with synthetic lead glaze prone to crazing. Authentic GI Jaipur Blue Pottery is completely clay-free, molded from quartz crystal powder and natural cobalt.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/wood_creak.ogg',
    processPhotos: ['/images/bluepottery.jpg', '/images/artisan_potter.jpg']
  },
  {
    id: 'chanderi-handwoven-silk',
    accessionNo: 'KG-2026-03',
    romanNumeral: 'III',
    title: 'Chanderi Royal Peacock Zari Weave',
    vernacularTitle: 'चंदेरी जरी रेशम वस्त्र',
    craftTradition: 'Handwoven Chanderi Brocade',
    category: 'textiles',
    artisan: 'Master Weaver Bismillah Ansari',
    artisanTitle: 'Sant Kabir National Awardee · 5th Generation Weaver',
    atelier: 'Pranpur Handloom Guild',
    region: 'Chanderi',
    state: 'Madhya Pradesh',
    period: 'Vedic Gossamer Silk Tradition',
    price: 36500,
    currency: 'INR',
    availability: 'Available',
    dimensions: '5.5 m Length × 1.15 m Width (with Blouse Piece)',
    weight: '520 g (Ultra-fine gossamer weave)',
    materials: [
      'Un-degummed Pure Mulberry Silk Warp (20/22 denier)',
      'Fine 120s Count Cotton Weft',
      'Real Silver Electroplated Gold Zari Thread',
      'Natural Madder Root (Manjistha Crimson Dye)',
      'Indigenous Acacia Gum finishing'
    ],
    technique: 'Pit loom weaving with extra-weft Jacquard dobby harness, interlocking weft (kadwa technique)',
    image: '/images/textile.jpg',
    makingStory: {
      summary: 'Woven in the historic fortified town of Chanderi, this textile exemplifies sheer gossamer transparency where pure mulberry silk is left un-degummed to retain its crisp acoustic rustle and metallic luminosity.',
      stages: [
        {
          step: '01',
          title: 'Warp Yarn Degumming & Sizing',
          description: 'Raw silk skeins are stretched along village lanes before dawn, sized with boiled rice congee to provide tensile strength, and warped onto thousand-thread bamboo rollers.'
        },
        {
          step: '02',
          title: 'Pit Loom Card Setting',
          description: 'The master weaver operates foot pedals recessed into an earthen trench pit, ensuring cool subterranean humidity maintains silk suppleness during dry afternoons.'
        },
        {
          step: '03',
          title: 'Kadwa Extra-Weft Peacock Brocade',
          description: 'Each dancing peacock medallion on the pallu is woven individually using a tiny wooden needle, ensuring no loose floats remain on the reverse of the textile.'
        }
      ]
    },
    artisanBio: 'Bismillah Ansari works from a 120-year-old courtyard house in Pranpur village, leading an atelier of twenty master weavers dedicated to preserving pure silver-gilt zari techniques.',
    artisanQuote: 'A true Chanderi should pass through a ring and reflect the moonlight like running river water. It is not cloth; it is woven breath.',
    artisanImage: '/images/artisan_weaver.jpg',
    directArtisanSharePercent: 86,
    position3D: [-1.0, 0.25, -0.6],
    rotation3D: [0, 0.1, 0],
    scale3D: [1, 1, 1],
    modelType: 'textile',
    colorPalette: ['#7A1C29', '#E0A838', '#1F2A38', '#EDE6D6'],
    isWomenSHG: false,
    materialCost: 11200,
    laborHours: 96,
    skillRatePerHour: 210,
    heritagePremium: 5140,
    machineLookalikePrice: 2200,
    machineLookalikeNotes: 'Powerloom polyester-viscose mix with plastic metallic lurex zari. Lacks the crisp acoustic rustle, lightness, and breathability of un-degummed handspun mulberry silk.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
    processPhotos: ['/images/textile.jpg', '/images/artisan_weaver.jpg']
  },
  {
    id: 'bastar-dhokra-brass',
    accessionNo: 'KG-2026-04',
    romanNumeral: 'IV',
    title: 'Bastar Lost-Wax Ritual Guardian Horse',
    vernacularTitle: 'बस्तर ढोकरा कांस्य अश्व',
    craftTradition: 'Bastar Dhokra Lost-Wax Metalcraft',
    category: 'metalcraft',
    artisan: 'Sukhruram Ghadwa',
    artisanTitle: 'Tribal Master Sculptor · Ghadwa Indigenous Community',
    atelier: 'Kondagaon Shilpgram Atelier',
    region: 'Kondagaon, Bastar',
    state: 'Chhattisgarh',
    period: 'Harappan 4000-year-old Cire Perdue Tradition',
    price: 32000,
    currency: 'INR',
    availability: 'Available',
    dimensions: '34.0 cm Height × 29.5 cm Length × 12.0 cm Depth',
    weight: '4.8 kg solid cast bell-metal',
    materials: [
      'Bell Metal Alloy (78% Copper, 22% Tin bronze)',
      'Natural Forest Honey Beeswax & Dammar Resin',
      'Alluvial Riverbed Clay (Garam Matti)',
      'Termite Mound Sand & Rice Husk Binding',
      'Charcoal Pit Kiln Fire'
    ],
    technique: 'Lost-wax casting (Cire Perdue), hand-extruded wax filigree cording, single-cast destructive mold',
    image: '/images/dhokra.jpg',
    makingStory: {
      summary: 'Direct descendant of the famous Dancing Girl of Mohenjo-Daro, Bastar Dhokra uses no machines or reusable molds. Every sculpture exists as an original single entity, its mold destroyed forever during casting.',
      stages: [
        {
          step: '01',
          title: 'Clay Core Sculpting',
          description: 'A core of clay mixed with rice husks is sculpted and air-dried under mahua trees to establish the inner hollow geometry of the ceremonial steed.'
        },
        {
          step: '02',
          title: 'Beeswax Filigree Wrapping',
          description: 'Natural beeswax mixed with dammar tree resin is hand-pressed through a wooden piston into paper-thin wax wires, wrapped spirally around the clay core to build ornamentation.'
        },
        {
          step: '03',
          title: 'The Molten Bronze Pour',
          description: 'Enclosed in successive coats of termite-mound slip and fired in a ground pit furnace, the wax drains away as molten bell-metal alloy rushes in to take its exact form.'
        }
      ]
    },
    artisanBio: 'Sukhruram Ghadwa belongs to the ancient metalsmith clan of Bastar. He practices the primordial ritual casting where each sculpture is blessed with forest prayers before the furnace is sealed.',
    artisanQuote: 'When the clay mold breaks open, what emerges has lived in the fire. No two horses ever breathe the same spirit, because the wax melts and only the bronze remembers.',
    artisanImage: '/images/artisan_metalcraft.jpg',
    directArtisanSharePercent: 90,
    position3D: [1.1, 0.15, 0.3],
    rotation3D: [0, -0.2, 0],
    scale3D: [1, 1, 1],
    modelType: 'brass',
    colorPalette: ['#A07830', '#4B4228', '#2D4436', '#E8D5B0'],
    isWomenSHG: false,
    materialCost: 7400,
    laborHours: 85,
    skillRatePerHour: 230,
    heritagePremium: 5050,
    machineLookalikePrice: 1500,
    machineLookalikeNotes: 'Die-cast zinc and scrap alloy in factory molds. Authentic Dhokra uses single-pour destructive cire perdue lost-wax casting with wild forest honey beeswax.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/metal_clink.ogg',
    processPhotos: ['/images/dhokra.jpg', '/images/artisan_metalcraft.jpg']
  },
  {
    id: 'channapatna-wood-sculpture',
    accessionNo: 'KG-2026-05',
    romanNumeral: 'V',
    title: 'Temple Spire & Avian Harmony Totem',
    vernacularTitle: 'चन्नपट्टण काष्ठ शिल्पकला',
    craftTradition: 'Channapatna Lathe-Turned Woodcraft',
    category: 'woodcraft',
    artisan: 'Syed Khaleel & Sons',
    artisanTitle: 'Master Wood Turner · 38 Years Atelier Practice',
    atelier: 'Gombegala Ooru Guild',
    region: 'Channapatna, Ramanagara',
    state: 'Karnataka',
    period: 'Tipu Sultan Persian-Deccani Synthesis',
    price: 18500,
    currency: 'INR',
    availability: 'Available',
    dimensions: '52.0 cm Height × 15.0 cm Base Diameter',
    weight: '2.1 kg',
    materials: [
      'Aale Mara / Ivory Wood (Wrightia tinctoria)',
      'Indian Rosewood (Dalbergia latifolia)',
      'Non-toxic Shellac (Natural Kerria lacca secretion)',
      'Natural Vegetable Dyes (Turmeric, Vermilion, Indigo)',
      'Tala Palm (Kewra screwpine leaf polishing pad)'
    ],
    technique: 'Foot/motorized lathe turning, frictional vegetable lac application, buffed leaf finish',
    image: '/images/woodcraft.jpg',
    makingStory: {
      summary: 'Crafted from indigenous Ivory Wood seasoned for over a year to prevent warping, this tiered sculptural totem synthesizes classical Dravidian temple shikhara geometry with avian totems of the Western Ghats.',
      stages: [
        {
          step: '01',
          title: 'Wood Seasoning & Cylinder Turning',
          description: 'Sustainably pruned Aale Mara branches are turned on high-speed spindles into precise geometric contours, balancing concentric stepped tiers with mathematical rhythm.'
        },
        {
          step: '02',
          title: 'Frictional Lac Melting',
          description: 'Hard sticks of natural lac infused with turmeric, kumkum, and indigo are pressed against the spinning wood. Frictional heat melts the organic glaze directly into the timber grain.'
        },
        {
          step: '03',
          title: 'Screwpine Leaf Polishing',
          description: 'Dried kewra screwpine leaves are pressed firmly against the rotating piece, creating an enduring mirror-like glass shine without chemical lacquers or polyurethane.'
        }
      ]
    },
    artisanBio: 'Syed Khaleel inherited his lathe workshop from his grandfather, who was among the royal woodturners of Mysore. Today he crafts architectural collector totems recognized across modern design biennials.',
    artisanQuote: 'The wood is soft like butter when it spins, but the lac gives it armor. We do not use chemical varnish—the heat of friction alone seals the soul of the tree.',
    artisanImage: '/images/artisan_potter.jpg',
    directArtisanSharePercent: 88,
    position3D: [3.2, 0.2, -0.6],
    rotation3D: [0, 0.15, 0],
    scale3D: [1, 1, 1],
    modelType: 'woodcraft',
    colorPalette: ['#A64B2A', '#D99B26', '#3D2817', '#EFE3CE'],
    isWomenSHG: false,
    materialCost: 2800,
    laborHours: 42,
    skillRatePerHour: 280,
    heritagePremium: 3940,
    machineLookalikePrice: 650,
    machineLookalikeNotes: 'MDF chipboard spray-painted with toxic polyurethane chemical varnish. Authentic Channapatna is lathe-turned from sustainably pruned ivory wood and finished with organic vegetable lac.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/wood_creak.ogg',
    processPhotos: ['/images/woodcraft.jpg', '/images/artisan_potter.jpg']
  },
  {
    id: 'kundan-meenakari-jewellery',
    accessionNo: 'KG-2026-06',
    romanNumeral: 'VI',
    title: 'Navratna Polki & Enamel Kundan Amulet',
    vernacularTitle: 'कुंदन मीनाकारी शाही ताबीज',
    craftTradition: 'Jaipur Royal Kundan & Meenakari',
    category: 'jewellery',
    artisan: 'Sunar Govind Lal Meenakar',
    artisanTitle: 'Royal Guild Court Goldsmith · 7th Generation Meenakar',
    atelier: 'Johari Bazaar Meenakar Darbar',
    region: 'Old Walled City, Jaipur',
    state: 'Rajasthan',
    period: 'Mughal-Rajput Imperial Court Goldsmithing',
    price: 89000,
    currency: 'INR',
    availability: 'Museum Archival Edition',
    dimensions: '7.8 cm Height × 5.4 cm Width (Pendant Amulet)',
    weight: '64.5 g (Net Gold 48.2 g, 22K/24K)',
    materials: [
      '24K Refined Hyper-pure Gold Foil (Kundan)',
      '22K Yellow Gold Base Champlevé Structure',
      'Uncut Natural Polki Diamonds (Flat cleavage facets)',
      'Natural Colombian Emerald Cabochon Center',
      'Basra Saltwater Seed Pearls',
      'Vitreous Champlevé Enamel (Cobalt, ruby glass & celadon green)'
    ],
    technique: 'Ghaat shaping, Khudai engraving, Meenakari champlevé firing, Jadai setting with purified gold foil',
    image: '/images/jewellery.jpg',
    makingStory: {
      summary: 'The ultimate pinnacle of Indian imperial goldsmithing. While the front presents diamond polki gemstones set in 24K pure cold-fused gold foil, the hidden reverse side reveals a confidential garden of brilliant fired enamel meenakari intended only for the wearer.',
      stages: [
        {
          step: '01',
          title: 'Ghaat & Champlevé Engraving (Khudai)',
          description: 'A 22K gold plate is hammered and minutely chiseled with microscopic grooves that outline blossoming lotus petals, nightingales, and royal foliage.'
        },
        {
          step: '02',
          title: 'Chamber Enamel Firing (Meenakari)',
          description: 'Pulverized mineral glass enamel is dusted into the engraved hollows and kiln-fired color by color—from hardest white and green at 820°C to delicate ruby red at 740°C.'
        },
        {
          step: '03',
          title: 'Kundan Foil Gem Cold-Setting (Jadai)',
          description: 'Polki diamonds are nestled in natural lac beds, surrounded by layers of hyper-refined 24K gold foil compressed cold with an agate point until the gold molecularly welds itself around each stone.'
        }
      ]
    },
    artisanBio: 'Govind Lal’s ancestry stretches back to the court jewelers summoned by Raja Man Singh I from Lahore to Jaipur in the 16th century. His atelier creates heirlooms for ceremonial royal treasuries.',
    artisanQuote: 'Meenakari is secret beauty. It touches the skin of the wearer. When you turn the gold over, you find a hidden sunrise that no one in the world can see except you.',
    artisanImage: '/images/artisan.jpg',
    directArtisanSharePercent: 85,
    position3D: [5.3, 0.1, 0.5],
    rotation3D: [0, -0.25, 0],
    scale3D: [1, 1, 1],
    modelType: 'jewellery',
    colorPalette: ['#DFBD76', '#1E7958', '#9B2226', '#FAF7F2'],
    isWomenSHG: false,
    materialCost: 52000,
    laborHours: 120,
    skillRatePerHour: 250,
    heritagePremium: 7000,
    machineLookalikePrice: 4500,
    machineLookalikeNotes: 'Brass casting with glued glass crystals and resin enamel. Authentic Kundan uses 24K cold-fused gold foil, natural uncut Polki diamonds, and reverse-side kiln-fired vitreous champlevé enamel.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/temple_bell_and_flute.ogg',
    processPhotos: ['/images/jewellery.jpg', '/images/artisan.jpg']
  },
  {
    id: 'kasuti-dharwad-saree',
    accessionNo: 'KG-2026-07',
    romanNumeral: 'VII',
    title: 'Gopura & Peacock Ilkal Kasuti Drape',
    vernacularTitle: 'ಧಾರವಾಡ ಕಸೂತಿ ಕರಕುಶಲ ಸೀರೆ',
    craftTradition: 'Dharwad Kasuti Hand Embroidery',
    category: 'textiles',
    artisan: 'Parvatamma Badiger & Mahila Sangha',
    artisanTitle: 'Lead Artisan · Karnataka State Shilpa Guru Awardee',
    atelier: 'Mahila Utkarsha Kasuti Sangha',
    region: 'Hubballi-Dharwad',
    state: 'Karnataka',
    period: 'Chalukya Dynasty 7th-Century Geometrical Needlework',
    price: 4200,
    currency: 'INR',
    availability: 'Available',
    dimensions: '6.2 m Length × 1.18 m Width (with Blouse Piece)',
    weight: '620 g (Pure Handloom Cotton-Silk)',
    materials: [
      'Handloom Ilkal Pure Cotton-Silk Ground',
      'Naturally-dyed Untwisted Silk Floss (Resham)',
      'Single Slender Eye Embroidery Needle (No hoop)',
      'Traditional Red & White Chariot Weft Border'
    ],
    technique: 'Thread-count counted geometric needlework (Gavanti double-running, Muragi zig-zag, Neygi weaving stitch, Menthi fenugreek seed stitch) without knots on reverse',
    image: '/images/textile.jpg',
    makingStory: {
      summary: 'Dating back to the Chalukya kingdom, Kasuti is an intricate counted-thread needlework where not a single knot is tied on either side of the cloth. Done by women across North Karnataka homes, the motifs depict sacred gopuras, palanquins, and peacocks aligned to warp and weft.',
      stages: [
        {
          step: '01',
          title: 'Warp & Weft Thread Counting',
          description: 'Without tracing or carbon stenciling, artisans count individual fabric threads under natural daylight to map micro-geometric chariot coordinates.'
        },
        {
          step: '02',
          title: 'Knotless Gavanti & Muragi Stitching',
          description: 'Untwisted resham silk floss is guided back and forth in continuous double-running stitches so both sides of the drape appear perfectly identical.'
        },
        {
          step: '03',
          title: 'GI Certification & Guild Pressing',
          description: 'Each finished Ilkal drape is inspected by the Mahila Sangha elders to verify count accuracy, knotless purity, and authenticated with the Geographical Indication seal.'
        }
      ]
    },
    artisanBio: 'Parvatamma Badiger leads the 45-member Mahila Utkarsha Kasuti Sangha in Dharwad. For 35 years she has trained younger rural women in knotless Kasuti, providing dignified, home-based livelihoods that bypass commercial middlemen.',
    artisanQuote: 'Kasuti is the silence of our fingers. If there is a knot on the back, the soul cannot move freely. A genuine Kasuti saree can be worn on either side without anyone knowing which is inside.',
    artisanImage: '/images/artisan_weaver.jpg',
    directArtisanSharePercent: 92,
    position3D: [0.0, 0.2, -0.8],
    rotation3D: [0, 0, 0],
    scale3D: [1, 1, 1],
    modelType: 'textile',
    colorPalette: ['#8B1E2E', '#D9822B', '#1C3144', '#FAF3E0'],
    isWomenSHG: true,
    shgName: 'Mahila Utkarsha Kasuti Sangha (Dharwad)',
    materialCost: 950,
    laborHours: 28,
    skillRatePerHour: 95,
    heritagePremium: 590,
    machineLookalikePrice: 400,
    machineLookalikeNotes: 'Computerized multi-needle embroidery uses cheap nylon thread that frays within 3 washes, with loose knotted loops on the back. Authentic Kasuti has zero knots on either face and uses hand-spun double-strand silk floss that lasts generations.',
    voiceClipUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
    processPhotos: ['/images/textile.jpg', '/images/artisan_weaver.jpg']
  }
];

export const EDITORIAL_STORIES: StoryArticle[] = [
  {
    id: 'living-pigments-kangra',
    title: 'The Breath on Wasli: Why Kangra Miniatures Cannot Be Rushed',
    subtitle: 'Inside the Himalayan atelier where an artist grinds lapis lazuli for 40 hours to paint a single eyelid.',
    readTime: '6 min read',
    craftTradition: 'Pahari Miniature Painting',
    artisan: 'Pandit Ram Swaroop Sharma',
    region: 'Kangra Valley, Himachal Pradesh',
    coverImage: '/images/artisan.jpg',
    excerpt: 'In an era of instant digital reproduction, the master painters of Kangra still pluck single hairs from Himalayan squirrels and wait weeks for monsoon clouds to pass before applying gum-arabic gold leaf.',
    paragraphs: [
      'High above the glacial Beas River, where the shadows of the Dhauladhar mountains stretch across terraced rice fields, Pandit Ram Swaroop Sharma sits cross-legged on a hand-knotted woolen rug. Before him lies a flat granite slab, a smooth river-worn agate burnisher, and a collection of ceramic bowls containing what appear to be ordinary stones.',
      'One is lapis lazuli from Badakhshan. Another is green malachite from the Deccan. A third is yellow peori, dried in the shade according to recipes unchanged since the reign of Raja Sansar Chand in 1786.',
      '“A miniature is not meant to be looked at from across a room,” Sharma says quietly, holding up a completed painting measuring no larger than an open palm. “It is meant to be held in your hands, inches from your eyelashes. If your heartbeat accelerates, the brush wavers. To paint the divine romance of Radha and Krishna, the artist must first silence all thoughts of the market.”',
      'The foundation of every Kangra painting is wasli—a paper made by laminating three leaves of unbleached river-reed paper with rice-flour starch infused with neem leaves to ward off silverfish. Once dry, the paper is buffed with a warm agate stone until it acquires the tactile texture of cold milk silk.',
      'On this surface, Sharma works with a brush containing three hairs from a mountain squirrel. The line is not drawn; it is guided by breath. A single floral vine encircling Radha’s pavilion contains over four hundred individual leaves, each modulated with microscopic washes of malachite green.',
      'Kaarigar supports Sharma’s gurukulam through direct patronage, guaranteeing that the four young apprentices under his tutelage earn living wages while devoting three full years solely to pigment grinding and line discipline.'
    ],
    quote: 'If you use synthetic paint, the color remains flat on the surface. But when you grind a mountain stone, the light enters the crystal and stays there for four hundred years.'
  },
  {
    id: 'fire-and-wax-bastar',
    title: 'The Four-Thousand-Year Wire: Bastar’s Lost-Wax Lineage',
    subtitle: 'How the Ghadwa tribal metalcasters of central India turn forest beeswax into singing bronze.',
    readTime: '8 min read',
    craftTradition: 'Bastar Dhokra',
    artisan: 'Sukhruram Ghadwa',
    region: 'Kondagaon, Bastar, Chhattisgarh',
    coverImage: '/images/artisan_metalcraft.jpg',
    excerpt: 'The technique used by Sukhruram Ghadwa to cast ritual horses for forest deities is identical to the one used to cast the Dancing Girl of Mohenjo-Daro in 2500 BCE.',
    paragraphs: [
      'In the Sal forests of Bastar, metal does not begin with an iron foundry or an industrial forge. It begins with the wild honey hunters who climb towering trees to gather honeycombs.',
      'Sukhruram Ghadwa melts this comb with resin from the Sal tree (dammar) and strains it through fine cloth into a vat of cold river water. The resulting wax is pliable, aromatic, and elastic. Using a simple hardwood press, Sukhruram extrudes the wax into long, thread-like cords.',
      'Around a core of sun-dried alluvial river clay mixed with termite-mound soil and rice husk, he winds these wax threads in continuous concentric spirals. Every muscle of the horse, every bridle ring, every protective bell is drawn with this organic thread.',
      '“There is no master mold,” Sukhruram explains, kneeling by the earthen kiln pit. “When we pour the molten bronze at twelve hundred degrees, the beeswax vaporizes and vanishes into the sky. It gives its life so the bronze can take its place. To create one horse, the wax must die.”',
      'Because the clay mold is cracked open with an iron mallet after cooling, each Dhokra sculpture is unique. It can never be reproduced or duplicated. What remains is a raw, tactile monument of archaic Indian metallurgy.'
    ],
    quote: 'The wax melts, the smoke rises into the Sal trees, and the bronze awakens. We are only the hands that hold the clay.'
  },
  {
    id: 'gossamer-threads-chanderi',
    title: 'The Woven Air of the Bundelkhand Plains',
    subtitle: 'Exploring the subterranean pit-looms of Chanderi, where silk is woven with pure silver-gilt zari.',
    readTime: '5 min read',
    craftTradition: 'Handwoven Textiles',
    artisan: 'Master Weaver Bismillah Ansari',
    region: 'Chanderi, Madhya Pradesh',
    coverImage: '/images/artisan_weaver.jpg',
    excerpt: 'Legend says the queens of Gwalior demanded sarees so lightweight that an entire six-yard drape could float on the surface of a lotus pond without sinking.',
    paragraphs: [
      'Step down into the stone pit of Bismillah Ansari’s workshop in Pranpur, and the intense summer heat of central India immediately drops by ten degrees. The floor is packed damp earth, designed to preserve the moisture content of delicate mulberry silk.',
      'Ansari’s hands dance across the wooden reed with rhythmic percussion. His left foot presses the bamboo treadle; the wooden shuttle shoots across the warp like a silver fish through clear water.',
      '“Chanderi is distinct because of its transparent structure,” Ansari says. “We do not strip the natural sericin gum from the silk before weaving. This gives the fabric its crystalline transparency and its characteristic soft crackle when draped.”',
      'The gold zari threads used in this masterwork are genuine silver-gilt, drawn to the thinness of a human hair. Each peacock motif on the pallu is woven with the kadwa technique, meaning no threads are carried on the underside—each motif is a self-contained island of gold.',
      'Through Kaarigar’s transparent economics, 86% of the purchase price goes straight into the Pranpur weaver collective, funding solar looms and health insurance for artisanal families.'
    ],
    quote: 'When you wear a real handloom Chanderi, you are wrapped in the humidity of our earth, the sound of wooden pedals, and five hundred years of memory.'
  }
];

export const MAKING_STEPS = [
  {
    id: 's1',
    craft: 'Pahari Miniature Painting',
    title: 'Wasli Paper & Burnishing',
    duration: '3 to 5 days',
    description: 'Multiple gossamer sheets of acid-free handmade paper are fused with starch paste and burnished with a hot agate stone until smooth as marble.',
    image: '/images/pahari.jpg'
  },
  {
    id: 's2',
    craft: 'Jaipur Blue Pottery',
    title: 'Quartz Frit Molding (Clay-Free)',
    duration: '7 to 10 days',
    description: 'Ground quartz crystal rock, glass powder, and gum are shaped in open molds—completely free of natural river clay.',
    image: '/images/bluepottery.jpg'
  },
  {
    id: 's3',
    craft: 'Handwoven Chanderi',
    title: 'Pit Loom Interlocking Zari',
    duration: '18 to 25 days',
    description: 'Woven in humid subterranean earthen pits where warp tension is controlled by foot treadles and silver zari extra-weft shuttles.',
    image: '/images/textile.jpg'
  },
  {
    id: 's4',
    craft: 'Bastar Dhokra',
    title: 'Lost-Wax Filament Cording',
    duration: '12 to 16 days',
    description: 'Beeswax threads are hand-extruded and coiled around clay cores before being incinerated by molten 1200°C bell-metal bronze.',
    image: '/images/dhokra.jpg'
  },
  {
    id: 's5',
    craft: 'Channapatna Woodcraft',
    title: 'Vegetable Lac Friction Turning',
    duration: '2 to 4 days',
    description: 'Ivory wood is spun on high-speed spindles while organic shellac colored with turmeric and vermilion is melted by friction into the wood grain.',
    image: '/images/woodcraft.jpg'
  },
  {
    id: 's6',
    craft: 'Kundan Meenakari',
    title: 'Champlevé Firing & Polki Foil Cold-Setting',
    duration: '20 to 30 days',
    description: 'Chiseled 22K gold is enameled in reverse-side kilns, while pure 24K gold foil is molecularly cold-welded around uncut diamond polki gems.',
    image: '/images/jewellery.jpg'
  }
];
