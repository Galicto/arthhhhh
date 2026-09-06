import { SchemeRule } from '../providers/types';

export const MOCK_SCHEMES: SchemeRule[] = [
  {
    schemeId: 'nsfdc_micro',
    name: 'NSFDC Micro Finance Scheme',
    ministry: 'Ministry of Social Justice and Empowerment',
    description: 'Micro-credit finance assistance to target group through SCAs for small business projects.',
    officialSourceUrl: 'https://nsfdc.nic.in/en/micro-credit-finance',
    effectiveDate: '2023-04-01',
    lastVerifiedAt: new Date().toISOString(),
    sourceConfidence: 'high',
    geographicCoverage: 'national',
    businessCategories: ['*'],
    maxProjectCost: 140000,
    marginRulePercent: 5,
    subsidyPercent: 0,
    requiredDocuments: ['Aadhaar Card', 'Caste Certificate', 'Income Certificate', 'Project Report / Quotation'],
    eligibilityRules: {
      socialCategories: ['SC'],
      isExistingEnterprise: false,
    }
  },
  {
    schemeId: 'nsfdc_term',
    name: 'NSFDC Term Loan Scheme',
    ministry: 'Ministry of Social Justice and Empowerment',
    description: 'Term loans for viable income generating projects.',
    officialSourceUrl: 'https://nsfdc.nic.in/en/term-loan',
    effectiveDate: '2023-04-01',
    lastVerifiedAt: new Date().toISOString(),
    sourceConfidence: 'high',
    geographicCoverage: 'national',
    businessCategories: ['*'],
    maxProjectCost: 3000000,
    marginRulePercent: 5,
    subsidyPercent: 0,
    requiredDocuments: ['Aadhaar Card', 'Caste Certificate', 'Income Certificate', 'Detailed Project Report', 'Bank Statement'],
    eligibilityRules: {
      socialCategories: ['SC'],
    }
  },
  {
    schemeId: 'pm_vishwakarma',
    name: 'PM Vishwakarma',
    ministry: 'Ministry of MSME',
    description: 'End-to-end holistic support to traditional artisans and craftspeople.',
    officialSourceUrl: 'https://pmvishwakarma.gov.in/',
    effectiveDate: '2023-09-17',
    lastVerifiedAt: new Date().toISOString(),
    sourceConfidence: 'high',
    geographicCoverage: 'national',
    businessCategories: ['Handicrafts and Traditional Artisan Work', 'Tailoring, Garment, and Textile Work', 'Beauty and Wellness Services', 'Repair and Technical Services'],
    maxProjectCost: 300000, // up to 3 lakh credit
    marginRulePercent: 0,
    subsidyPercent: 5, // interest subvention
    requiredDocuments: ['Aadhaar Card', 'Bank Account Details', 'Skill Certification / Artisan Proof'],
    eligibilityRules: {
      isArtisan: true,
    }
  },
  {
    schemeId: 'pm_mudra',
    name: 'Pradhan Mantri Mudra Yojana (PMMY) - Shishu',
    ministry: 'Ministry of Finance',
    description: 'Loans up to ₹50,000 for starting a small business.',
    officialSourceUrl: 'https://www.mudra.org.in/',
    effectiveDate: '2015-04-08',
    lastVerifiedAt: new Date().toISOString(),
    sourceConfidence: 'high',
    geographicCoverage: 'national',
    businessCategories: ['Retail and Kirana', 'Food and Tiffin Services', 'Dairy and Animal Husbandry', 'Tailoring, Garment, and Textile Work'],
    maxProjectCost: 50000,
    marginRulePercent: 0,
    requiredDocuments: ['Aadhaar Card', 'Business Plan', 'Quotations for machinery/items'],
    eligibilityRules: {
    }
  },
  {
    schemeId: 'stand_up_india',
    name: 'Stand-Up India',
    ministry: 'Ministry of Finance',
    description: 'Facilitates bank loans between ₹10 lakh and ₹1 Crore to at least one SC/ST borrower and one woman borrower per bank branch for setting up a greenfield enterprise.',
    officialSourceUrl: 'https://www.standupmitra.in/',
    effectiveDate: '2016-04-05',
    lastVerifiedAt: new Date().toISOString(),
    sourceConfidence: 'high',
    geographicCoverage: 'national',
    businessCategories: ['Manufacturing', 'Services', 'Agri-Allied', 'Trading'],
    maxProjectCost: 10000000,
    marginRulePercent: 15, // Promoters contribution minimum 15%
    requiredDocuments: ['Identity Proof', 'Address Proof', 'Business Address Proof', 'Project Report', 'Caste Certificate (if applicable)'],
    eligibilityRules: {
      socialCategories: ['SC', 'ST'],
      genders: ['Female'], // or female
      isExistingEnterprise: false, // Must be greenfield
    }
  }
];
