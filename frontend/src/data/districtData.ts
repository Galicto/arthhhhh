/**
 * districtData.ts — Seeded demo district data for Arthniti
 * 
 * Representative Indian districts for the SIH demo.
 * Labeled as demo/representative data — NOT live census data.
 */

export interface BusinessCategory {
  name: string;
  nameHi: string;
  competitorDensity: 'low' | 'medium' | 'high';
  avgMonthlyRevenue: number; // INR
  avgMonthlyOperatingCost: number; // INR
  demandProxyScore: number; // 0-100
}

export interface DistrictData {
  id: string;
  name: string;
  nameHi: string;
  state: string;
  stateHi: string;
  population: number;
  literacyRate: number; // percentage
  mainEconomy: string;
  mainEconomyHi: string;
  avgAnnualIncome: number; // INR
  commonBusinessCategories: BusinessCategory[];
  nearestTown: string;
  nearestTownDistanceKm: number;
  bankBranchesPerLakh: number;
  internetPenetration: number; // percentage
}

export const DISTRICTS: DistrictData[] = [
  {
    id: 'nagpur',
    name: 'Nagpur',
    nameHi: 'नागपुर',
    state: 'Maharashtra',
    stateHi: 'महाराष्ट्र',
    population: 4_653_000,
    literacyRate: 89.5,
    mainEconomy: 'Services, Trade, Agriculture (Oranges), MSME',
    mainEconomyHi: 'सेवा, व्यापार, कृषि (संतरा), MSME',
    avgAnnualIncome: 120_000,
    commonBusinessCategories: [
      { name: 'Grocery / Kirana Store', nameHi: 'किराना स्टोर', competitorDensity: 'high', avgMonthlyRevenue: 35000, avgMonthlyOperatingCost: 24000, demandProxyScore: 88 },
      { name: 'Printing & Stationery', nameHi: 'प्रिंटिंग और स्टेशनरी', competitorDensity: 'medium', avgMonthlyRevenue: 22000, avgMonthlyOperatingCost: 9000, demandProxyScore: 82 },
      { name: 'Food / Tiffin Service', nameHi: 'खाना / टिफिन', competitorDensity: 'medium', avgMonthlyRevenue: 28000, avgMonthlyOperatingCost: 14000, demandProxyScore: 85 },
      { name: 'Mobile / Electronics Repair', nameHi: 'मोबाइल मरम्मत', competitorDensity: 'medium', avgMonthlyRevenue: 40000, avgMonthlyOperatingCost: 15000, demandProxyScore: 80 },
    ],
    nearestTown: 'Nagpur',
    nearestTownDistanceKm: 0,
    bankBranchesPerLakh: 12,
    internetPenetration: 55,
  },
  {
    id: 'nizamabad',
    name: 'Nizamabad',
    nameHi: 'निज़ामाबाद',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 1_567_000,
    literacyRate: 65.7,
    mainEconomy: 'Agriculture (Turmeric, Paddy, Sugarcane)',
    mainEconomyHi: 'कृषि (हल्दी, धान, गन्ना)',
    avgAnnualIncome: 78_000,
    commonBusinessCategories: [
      { name: 'Turmeric Processing', nameHi: 'हल्दी प्रसंस्करण', competitorDensity: 'medium', avgMonthlyRevenue: 45_000, avgMonthlyOperatingCost: 28_000, demandProxyScore: 85 },
      { name: 'Dairy & Milk Products', nameHi: 'डेयरी और दूध उत्पाद', competitorDensity: 'high', avgMonthlyRevenue: 35_000, avgMonthlyOperatingCost: 20_000, demandProxyScore: 90 },
      { name: 'Grocery / Kirana Store', nameHi: 'किराना स्टोर', competitorDensity: 'high', avgMonthlyRevenue: 30_000, avgMonthlyOperatingCost: 22_000, demandProxyScore: 95 },
      { name: 'Agricultural Equipment Rental', nameHi: 'कृषि उपकरण किराया', competitorDensity: 'low', avgMonthlyRevenue: 55_000, avgMonthlyOperatingCost: 15_000, demandProxyScore: 70 },
      { name: 'Poultry Farm', nameHi: 'मुर्गी पालन', competitorDensity: 'medium', avgMonthlyRevenue: 40_000, avgMonthlyOperatingCost: 25_000, demandProxyScore: 80 },
      { name: 'Tailoring / Garment Unit', nameHi: 'सिलाई / वस्त्र इकाई', competitorDensity: 'medium', avgMonthlyRevenue: 25_000, avgMonthlyOperatingCost: 10_000, demandProxyScore: 75 },
    ],
    nearestTown: 'Hyderabad',
    nearestTownDistanceKm: 150,
    bankBranchesPerLakh: 9.2,
    internetPenetration: 42,
  },
  {
    id: 'karimnagar',
    name: 'Karimnagar',
    nameHi: 'करीमनगर',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 1_005_000,
    literacyRate: 63.2,
    mainEconomy: 'Agriculture (Cotton, Rice), Granite Industry',
    mainEconomyHi: 'कृषि (कपास, चावल), ग्रेनाइट उद्योग',
    avgAnnualIncome: 72_000,
    commonBusinessCategories: [
      { name: 'Mango Processing / Pulp', nameHi: 'आम प्रसंस्करण / गूदा', competitorDensity: 'medium', avgMonthlyRevenue: 50_000, avgMonthlyOperatingCost: 30_000, demandProxyScore: 85 },
      { name: 'Mineral Water Plant', nameHi: 'मिनरल वाटर प्लांट', competitorDensity: 'medium', avgMonthlyRevenue: 45_000, avgMonthlyOperatingCost: 22_000, demandProxyScore: 95 },
      { name: 'Fabrication / Welding Shop', nameHi: 'वेल्डिंग की दुकान', competitorDensity: 'high', avgMonthlyRevenue: 35_000, avgMonthlyOperatingCost: 15_000, demandProxyScore: 80 },
      { name: 'Two-Wheeler Showroom/Repair', nameHi: 'दुपहिया वाहन शोरूम/मरम्मत', competitorDensity: 'high', avgMonthlyRevenue: 55_000, avgMonthlyOperatingCost: 35_000, demandProxyScore: 85 },
      { name: 'Fertilizer & Pesticide Shop', nameHi: 'उर्वरक और कीटनाशक की दुकान', competitorDensity: 'medium', avgMonthlyRevenue: 48_000, avgMonthlyOperatingCost: 38_000, demandProxyScore: 90 },
      { name: 'Mobile Repair & Accessories', nameHi: 'मोबाइल मरम्मत और सहायक उपकरण', competitorDensity: 'high', avgMonthlyRevenue: 22_000, avgMonthlyOperatingCost: 8_000, demandProxyScore: 75 },
    ],
    nearestTown: 'Hyderabad',
    nearestTownDistanceKm: 165,
    bankBranchesPerLakh: 8.5,
    internetPenetration: 38,
  },
  {
    id: 'warangal',
    name: 'Warangal',
    nameHi: 'वारंगल',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 3_522_000,
    literacyRate: 67.1,
    mainEconomy: 'Agriculture, Tourism, Education Hub',
    mainEconomyHi: 'कृषि, पर्यटन, शिक्षा केंद्र',
    avgAnnualIncome: 85_000,
    commonBusinessCategories: [
      { name: 'Food / Tiffin Center', nameHi: 'फूड / टिफिन सेंटर', competitorDensity: 'high', avgMonthlyRevenue: 32_000, avgMonthlyOperatingCost: 15_000, demandProxyScore: 88 },
      { name: 'Stationery & Printing', nameHi: 'स्टेशनरी और प्रिंटिंग', competitorDensity: 'medium', avgMonthlyRevenue: 28_000, avgMonthlyOperatingCost: 12_000, demandProxyScore: 82 },
      { name: 'Dairy & Milk Products', nameHi: 'डेयरी और दूध उत्पाद', competitorDensity: 'medium', avgMonthlyRevenue: 38_000, avgMonthlyOperatingCost: 22_000, demandProxyScore: 85 },
      { name: 'Beauty Parlour / Salon', nameHi: 'ब्यूटी पार्लर / सैलून', competitorDensity: 'medium', avgMonthlyRevenue: 25_000, avgMonthlyOperatingCost: 10_000, demandProxyScore: 78 },
      { name: 'Carpentry / Furniture', nameHi: 'बढ़ईगीरी / फर्नीचर', competitorDensity: 'low', avgMonthlyRevenue: 45_000, avgMonthlyOperatingCost: 20_000, demandProxyScore: 70 },
      { name: 'Organic Farming Products', nameHi: 'जैविक कृषि उत्पाद', competitorDensity: 'low', avgMonthlyRevenue: 50_000, avgMonthlyOperatingCost: 25_000, demandProxyScore: 65 },
    ],
    nearestTown: 'Hyderabad',
    nearestTownDistanceKm: 145,
    bankBranchesPerLakh: 10.1,
    internetPenetration: 48,
  },
  {
    id: 'siddipet',
    name: 'Siddipet',
    nameHi: 'सिद्दिपेट',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 993_000,
    literacyRate: 61.4,
    mainEconomy: 'Agriculture (Paddy, Maize), Sericulture',
    mainEconomyHi: 'कृषि (धान, मक्का), रेशम उत्पादन',
    avgAnnualIncome: 68_000,
    commonBusinessCategories: [
      { name: 'Silver Filigree Handicrafts', nameHi: 'चांदी की कारीगरी', competitorDensity: 'medium', avgMonthlyRevenue: 35_000, avgMonthlyOperatingCost: 15_000, demandProxyScore: 65 },
      { name: 'Automobile Repair / Mechanic', nameHi: 'ऑटोमोबाइल मरम्मत / मैकेनिक', competitorDensity: 'high', avgMonthlyRevenue: 40_000, avgMonthlyOperatingCost: 18_000, demandProxyScore: 85 },
      { name: 'Beauty Parlour', nameHi: 'ब्यूटी पार्लर', competitorDensity: 'high', avgMonthlyRevenue: 28_000, avgMonthlyOperatingCost: 8_000, demandProxyScore: 80 },
      { name: 'Spice Grinding Mill', nameHi: 'मसाला पीसने की मिल', competitorDensity: 'low', avgMonthlyRevenue: 45_000, avgMonthlyOperatingCost: 22_000, demandProxyScore: 75 },
      { name: 'Mobile Sales & Repair', nameHi: 'मोबाइल बिक्री और मरम्मत', competitorDensity: 'high', avgMonthlyRevenue: 38_000, avgMonthlyOperatingCost: 20_000, demandProxyScore: 90 },
      { name: 'Cycle / E-Rickshaw Repair', nameHi: 'साइकिल / ई-रिक्शा मरम्मत', competitorDensity: 'low', avgMonthlyRevenue: 22_000, avgMonthlyOperatingCost: 5_000, demandProxyScore: 70 },
    ],
    nearestTown: 'Hyderabad',
    nearestTownDistanceKm: 100,
    bankBranchesPerLakh: 7.8,
    internetPenetration: 35,
  },
  {
    id: 'kamareddy',
    name: 'Kamareddy',
    nameHi: 'कामारेड्डी',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 972_000,
    literacyRate: 58.3,
    mainEconomy: 'Agriculture (Soybean, Cotton, Pulses)',
    mainEconomyHi: 'कृषि (सोयाबीन, कपास, दालें)',
    avgAnnualIncome: 64_000,
    commonBusinessCategories: [
      { name: 'Oil Mill (Groundnut/Soybean)', nameHi: 'तेल मिल (मूंगफली/सोयाबीन)', competitorDensity: 'low', avgMonthlyRevenue: 48_000, avgMonthlyOperatingCost: 25_000, demandProxyScore: 75 },
      { name: 'Dairy & Milk Products', nameHi: 'डेयरी और दूध उत्पाद', competitorDensity: 'medium', avgMonthlyRevenue: 32_000, avgMonthlyOperatingCost: 15_000, demandProxyScore: 80 },
      { name: 'Grocery / Kirana Store', nameHi: 'किराना स्टोर', competitorDensity: 'high', avgMonthlyRevenue: 24_000, avgMonthlyOperatingCost: 12_000, demandProxyScore: 95 },
      { name: 'Brick Kiln', nameHi: 'ईंट भट्टा', competitorDensity: 'low', avgMonthlyRevenue: 65_000, avgMonthlyOperatingCost: 35_000, demandProxyScore: 60 },
      { name: 'Tailoring / Garment Unit', nameHi: 'सिलाई / वस्त्र इकाई', competitorDensity: 'medium', avgMonthlyRevenue: 20_000, avgMonthlyOperatingCost: 7_000, demandProxyScore: 70 },
      { name: 'Fertilizer & Seeds Shop', nameHi: 'उर्वरक और बीज दुकान', competitorDensity: 'medium', avgMonthlyRevenue: 38_000, avgMonthlyOperatingCost: 20_000, demandProxyScore: 85 },
    ],
    nearestTown: 'Hyderabad',
    nearestTownDistanceKm: 175,
    bankBranchesPerLakh: 7.2,
    internetPenetration: 30,
  },
  {
    id: 'adilabad',
    name: 'Adilabad',
    nameHi: 'आदिलाबाद',
    state: 'Telangana',
    stateHi: 'तेलंगाना',
    population: 708_000,
    literacyRate: 56.1,
    mainEconomy: 'Agriculture (Cotton), Forest Products, Tribal Crafts',
    mainEconomyHi: 'कृषि (कपास), वन उत्पाद, आदिवासी शिल्प',
    avgAnnualIncome: 58_000,
    commonBusinessCategories: [
      { name: 'Cotton Ginning / Processing', nameHi: 'कपास ओटाई', competitorDensity: 'medium', avgMonthlyRevenue: 65_000, avgMonthlyOperatingCost: 45_000, demandProxyScore: 80 },
      { name: 'Oil Extraction Mill', nameHi: 'तेल निकालने की मिल', competitorDensity: 'low', avgMonthlyRevenue: 55_000, avgMonthlyOperatingCost: 35_000, demandProxyScore: 75 },
      { name: 'Readymade Garments', nameHi: 'रेडीमेड कपड़े', competitorDensity: 'high', avgMonthlyRevenue: 35_000, avgMonthlyOperatingCost: 20_000, demandProxyScore: 85 },
      { name: 'Agri-Inputs Dealer', nameHi: 'कृषि आदान डीलर', competitorDensity: 'medium', avgMonthlyRevenue: 50_000, avgMonthlyOperatingCost: 35_000, demandProxyScore: 90 },
      { name: 'Footwear Manufacturing / Sales', nameHi: 'जूते-चप्पल बिक्री', competitorDensity: 'high', avgMonthlyRevenue: 28_000, avgMonthlyOperatingCost: 12_000, demandProxyScore: 85 },
    ],
    nearestTown: 'Nagpur',
    nearestTownDistanceKm: 280,
    bankBranchesPerLakh: 6.5,
    internetPenetration: 25,
  },
];

export const getDistrictById = (id: string): DistrictData | undefined =>
  DISTRICTS.find(d => d.id === id);

export const getDistrictNames = (): { id: string; name: string; nameHi: string; state: string }[] =>
  DISTRICTS.map(d => ({ id: d.id, name: d.name, nameHi: d.nameHi, state: d.state }));
