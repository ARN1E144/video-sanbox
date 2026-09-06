// =====================================================
// ISO/IEC 27001:2022
// ANNEX A CONTROL CATALOGUE
// =====================================================
//
// 93 controls
//
// A.5 Organisational   = 37
// A.6 People           = 8
// A.7 Physical         = 14
// A.8 Technological    = 34
//
// Descriptions are original plain-English summaries.
// They are not reproduced normative text from ISO.
// =====================================================

const frameworkId = "iso27001-2022";

const control = (
  reference,
  title,
  summary,
  theme
) => ({
  id: reference.toLowerCase().replace(".", "-"),
  frameworkId,
  reference,
  title,
  summary,
  theme,
  ownerId: null,
  status: "not_assessed",
  riskLevel: "medium",
  evidenceRequired: true,
  evidenceIds: [],
  actionIds: [],
  lastReviewedAt: null,
  nextReviewAt: null,
});


// =====================================================
// A.5 — ORGANISATIONAL CONTROLS
// 37 CONTROLS
// =====================================================

const organisational = [

  control(
    "A.5.1",
    "Information security policies",
    "Establish, approve, communicate and periodically review information security policies.",
    "Organisational"
  ),

  control(
    "A.5.2",
    "Information security roles",
    "Define and communicate security responsibilities, ownership and accountability.",
    "Organisational"
  ),

  control(
    "A.5.3",
    "Segregation of duties",
    "Separate conflicting responsibilities to reduce the opportunity for error or misuse.",
    "Organisational"
  ),

  control(
    "A.5.4",
    "Management responsibilities",
    "Ensure managers actively support and enforce information security requirements.",
    "Organisational"
  ),

  control(
    "A.5.5",
    "Contact with authorities",
    "Maintain appropriate relationships and communication channels with relevant authorities.",
    "Organisational"
  ),

  control(
    "A.5.6",
    "Contact with special interest groups",
    "Maintain appropriate relationships with professional, security and industry communities.",
    "Organisational"
  ),

  control(
    "A.5.7",
    "Threat intelligence",
    "Collect and analyse relevant information about current and emerging security threats.",
    "Organisational"
  ),

  control(
    "A.5.8",
    "Security in project management",
    "Integrate information security considerations into project planning and delivery.",
    "Organisational"
  ),

  control(
    "A.5.9",
    "Asset inventory",
    "Maintain an accurate inventory of information and associated assets.",
    "Organisational"
  ),

  control(
    "A.5.10",
    "Acceptable use of assets",
    "Define appropriate use and handling requirements for organisational information and assets.",
    "Organisational"
  ),

  control(
    "A.5.11",
    "Return of assets",
    "Ensure organisational assets are returned when employment, contracts or responsibilities end.",
    "Organisational"
  ),

  control(
    "A.5.12",
    "Information classification",
    "Classify information according to its security needs and business importance.",
    "Organisational"
  ),

  control(
    "A.5.13",
    "Information labelling",
    "Apply suitable labels or handling indicators to classified information.",
    "Organisational"
  ),

  control(
    "A.5.14",
    "Information transfer",
    "Define secure methods and controls for transferring information internally and externally.",
    "Organisational"
  ),

  control(
    "A.5.15",
    "Access control",
    "Establish rules governing access to information and related assets.",
    "Organisational"
  ),

  control(
    "A.5.16",
    "Identity management",
    "Manage the complete lifecycle of identities used to access organisational resources.",
    "Organisational"
  ),

  control(
    "A.5.17",
    "Authentication information",
    "Protect authentication information throughout its creation, use, storage and lifecycle.",
    "Organisational"
  ),

  control(
    "A.5.18",
    "Access rights",
    "Provision, review, modify and remove access rights according to business requirements.",
    "Organisational"
  ),

  control(
    "A.5.19",
    "Supplier security",
    "Manage information security risks arising from supplier relationships.",
    "Organisational"
  ),

  control(
    "A.5.20",
    "Supplier agreements",
    "Define appropriate information security requirements within supplier agreements.",
    "Organisational"
  ),

  control(
    "A.5.21",
    "ICT supply chain",
    "Manage security risks throughout the ICT products and services supply chain.",
    "Organisational"
  ),

  control(
    "A.5.22",
    "Supplier service monitoring",
    "Regularly monitor, review and manage changes to supplier services and security performance.",
    "Organisational"
  ),

  control(
    "A.5.23",
    "Cloud service security",
    "Define and manage information security requirements when using cloud services.",
    "Organisational"
  ),

  control(
    "A.5.24",
    "Incident management planning",
    "Prepare processes, responsibilities and procedures for responding to information security incidents.",
    "Organisational"
  ),

  control(
    "A.5.25",
    "Assessment of security events",
    "Assess security events to determine whether they constitute information security incidents.",
    "Organisational"
  ),

  control(
    "A.5.26",
    "Response to incidents",
    "Respond to information security incidents using defined processes and responsibilities.",
    "Organisational"
  ),

  control(
    "A.5.27",
    "Learning from incidents",
    "Use information from incidents to improve security controls and future response.",
    "Organisational"
  ),

  control(
    "A.5.28",
    "Evidence collection",
    "Establish processes for identifying, collecting and preserving information relevant to security incidents.",
    "Organisational"
  ),

  control(
    "A.5.29",
    "Security during disruption",
    "Maintain appropriate information security during business disruption.",
    "Organisational"
  ),

  control(
    "A.5.30",
    "ICT readiness for continuity",
    "Ensure ICT capabilities support organisational continuity requirements.",
    "Organisational"
  ),

  control(
    "A.5.31",
    "Legal and contractual requirements",
    "Identify and maintain applicable legal, regulatory and contractual information security requirements.",
    "Organisational"
  ),

  control(
    "A.5.32",
    "Intellectual property",
    "Protect intellectual property and comply with applicable rights and licensing requirements.",
    "Organisational"
  ),

  control(
    "A.5.33",
    "Protection of records",
    "Protect important records against loss, destruction, falsification and unauthorised access.",
    "Organisational"
  ),

  control(
    "A.5.34",
    "Privacy and personal information",
    "Identify and protect personal information according to applicable privacy requirements.",
    "Organisational"
  ),

  control(
    "A.5.35",
    "Independent security review",
    "Periodically obtain independent review of information security management and controls.",
    "Organisational"
  ),

  control(
    "A.5.36",
    "Compliance with security policies",
    "Regularly review compliance with organisational security policies, rules and standards.",
    "Organisational"
  ),

  control(
    "A.5.37",
    "Documented operating procedures",
    "Maintain appropriate documented procedures for important operational activities.",
    "Organisational"
  ),

];


// =====================================================
// A.6 — PEOPLE CONTROLS
// 8 CONTROLS
// =====================================================

const people = [

  control(
    "A.6.1",
    "Personnel screening",
    "Perform appropriate background checks before granting personnel access to sensitive resources.",
    "People"
  ),

  control(
    "A.6.2",
    "Employment terms",
    "Include relevant information security responsibilities within employment arrangements.",
    "People"
  ),

  control(
    "A.6.3",
    "Security awareness and training",
    "Provide personnel with appropriate information security awareness, education and training.",
    "People"
  ),

  control(
    "A.6.4",
    "Disciplinary process",
    "Maintain a defined process for addressing information security violations.",
    "People"
  ),

  control(
    "A.6.5",
    "Responsibilities after employment",
    "Define and enforce security responsibilities that continue after employment or contractual relationships end.",
    "People"
  ),

  control(
    "A.6.6",
    "Confidentiality agreements",
    "Use appropriate confidentiality commitments to protect sensitive organisational information.",
    "People"
  ),

  control(
    "A.6.7",
    "Remote working",
    "Apply appropriate security measures to information and systems used during remote working.",
    "People"
  ),

  control(
    "A.6.8",
    "Security event reporting",
    "Provide personnel with a clear method for reporting suspected security events or weaknesses.",
    "People"
  ),

];


// =====================================================
// A.7 — PHYSICAL CONTROLS
// 14 CONTROLS
// =====================================================

const physical = [

  control(
    "A.7.1",
    "Physical security perimeters",
    "Define and protect physical boundaries around areas containing sensitive information or assets.",
    "Physical"
  ),

  control(
    "A.7.2",
    "Physical entry",
    "Control physical access to secure areas using appropriate entry mechanisms.",
    "Physical"
  ),

  control(
    "A.7.3",
    "Securing offices and facilities",
    "Protect offices, rooms and facilities containing information or information-processing assets.",
    "Physical"
  ),

  control(
    "A.7.4",
    "Physical security monitoring",
    "Monitor relevant physical environments to detect and respond to security events.",
    "Physical"
  ),

  control(
    "A.7.5",
    "Physical and environmental threats",
    "Protect against physical and environmental threats such as fire, flood and other hazards.",
    "Physical"
  ),

  control(
    "A.7.6",
    "Working in secure areas",
    "Establish appropriate security requirements for activities performed within secure areas.",
    "Physical"
  ),

  control(
    "A.7.7",
    "Clear desk and clear screen",
    "Reduce exposure of sensitive information through clear desk and screen practices.",
    "Physical"
  ),

  control(
    "A.7.8",
    "Equipment placement and protection",
    "Position and protect equipment to reduce risks from damage, interference and unauthorised access.",
    "Physical"
  ),

  control(
    "A.7.9",
    "Security of assets off-premises",
    "Protect organisational assets when they are used or stored outside controlled facilities.",
    "Physical"
  ),

  control(
    "A.7.10",
    "Storage media",
    "Manage storage media throughout its lifecycle to protect the information stored on it.",
    "Physical"
  ),

  control(
    "A.7.11",
    "Supporting utilities",
    "Protect information-processing facilities against failures or disruption of supporting utilities.",
    "Physical"
  ),

  control(
    "A.7.12",
    "Cabling security",
    "Protect power and communications cabling from interception, interference or damage.",
    "Physical"
  ),

  control(
    "A.7.13",
    "Equipment maintenance",
    "Maintain equipment appropriately to preserve availability, integrity and security.",
    "Physical"
  ),

  control(
    "A.7.14",
    "Secure disposal and reuse",
    "Ensure equipment and media are securely disposed of or reused without exposing information.",
    "Physical"
  ),

];


// =====================================================
// A.8 — TECHNOLOGICAL CONTROLS
// 34 CONTROLS
// =====================================================

const technological = [

  control(
    "A.8.1",
    "User endpoint devices",
    "Protect laptops, desktops, mobile devices and other user endpoint equipment.",
    "Technological"
  ),

  control(
    "A.8.2",
    "Privileged access rights",
    "Restrict and carefully manage privileged access to systems and information.",
    "Technological"
  ),

  control(
    "A.8.3",
    "Information access restriction",
    "Restrict access to information according to defined business and security requirements.",
    "Technological"
  ),

  control(
    "A.8.4",
    "Source code access",
    "Control access to source code and protect it from unauthorised modification or disclosure.",
    "Technological"
  ),

  control(
    "A.8.5",
    "Secure authentication",
    "Implement secure authentication mechanisms appropriate to access risks.",
    "Technological"
  ),

  control(
    "A.8.6",
    "Capacity management",
    "Monitor and manage system capacity to maintain required performance and availability.",
    "Technological"
  ),

  control(
    "A.8.7",
    "Protection against malware",
    "Implement measures to prevent, detect and respond to malicious software.",
    "Technological"
  ),

  control(
    "A.8.8",
    "Technical vulnerability management",
    "Identify, assess and address technical vulnerabilities in systems and software.",
    "Technological"
  ),

  control(
    "A.8.9",
    "Configuration management",
    "Establish and maintain secure configurations for systems, applications and infrastructure.",
    "Technological"
  ),

  control(
    "A.8.10",
    "Information deletion",
    "Securely remove information when it is no longer required.",
    "Technological"
  ),

  control(
    "A.8.11",
    "Data masking",
    "Apply appropriate masking techniques to protect sensitive information.",
    "Technological"
  ),

  control(
    "A.8.12",
    "Data leakage prevention",
    "Use measures to detect and prevent unauthorised disclosure or leakage of information.",
    "Technological"
  ),

  control(
    "A.8.13",
    "Information backup",
    "Maintain and test backups appropriate to business and recovery requirements.",
    "Technological"
  ),

  control(
    "A.8.14",
    "Redundancy of processing facilities",
    "Provide appropriate redundancy to support required information-processing availability.",
    "Technological"
  ),

  control(
    "A.8.15",
    "Logging",
    "Generate and protect appropriate logs for security monitoring and investigation.",
    "Technological"
  ),

  control(
    "A.8.16",
    "Monitoring activities",
    "Monitor systems and activities to identify potentially abnormal or security-relevant behaviour.",
    "Technological"
  ),

  control(
    "A.8.17",
    "Clock synchronisation",
    "Synchronise system clocks where necessary to support reliable logging and investigation.",
    "Technological"
  ),

  control(
    "A.8.18",
    "Privileged utility programs",
    "Restrict and control powerful system utilities that could bypass normal security controls.",
    "Technological"
  ),

  control(
    "A.8.19",
    "Software installation",
    "Control software installation on operational systems.",
    "Technological"
  ),

  control(
    "A.8.20",
    "Network security",
    "Protect networks and network services against unauthorised access and compromise.",
    "Technological"
  ),

  control(
    "A.8.21",
    "Security of network services",
    "Define and manage security requirements for network services.",
    "Technological"
  ),

  control(
    "A.8.22",
    "Network segregation",
    "Separate networks or network zones where appropriate to reduce security risk.",
    "Technological"
  ),

  control(
    "A.8.23",
    "Web filtering",
    "Control access to external websites and web content according to security requirements.",
    "Technological"
  ),

  control(
    "A.8.24",
    "Use of cryptography",
    "Define and implement appropriate cryptographic protections and key management.",
    "Technological"
  ),

  control(
    "A.8.25",
    "Secure development lifecycle",
    "Integrate information security throughout the software development lifecycle.",
    "Technological"
  ),

  control(
    "A.8.26",
    "Application security requirements",
    "Define security requirements for applications before and during development or acquisition.",
    "Technological"
  ),

  control(
    "A.8.27",
    "Secure system architecture",
    "Apply security principles when designing and maintaining system architectures.",
    "Technological"
  ),

  control(
    "A.8.28",
    "Secure coding",
    "Apply secure coding practices to reduce vulnerabilities in developed software.",
    "Technological"
  ),

  control(
    "A.8.29",
    "Security testing",
    "Perform appropriate security testing throughout development and before release.",
    "Technological"
  ),

  control(
    "A.8.30",
    "Outsourced development",
    "Manage security requirements and oversight when software development is outsourced.",
    "Technological"
  ),

  control(
    "A.8.31",
    "Separation of development and production",
    "Separate development, testing and production environments to reduce operational risk.",
    "Technological"
  ),

  control(
    "A.8.32",
    "Change management",
    "Control changes to systems and information-processing environments through defined processes.",
    "Technological"
  ),

  control(
    "A.8.33",
    "Test information",
    "Protect information used for testing and prevent inappropriate exposure of production data.",
    "Technological"
  ),

  control(
    "A.8.34",
    "Protection during audit testing",
    "Protect systems and information when audit or assurance testing is performed.",
    "Technological"
  ),

];


// =====================================================
// COMPLETE FRAMEWORK
// =====================================================

const controls = [
  ...organisational,
  ...people,
  ...physical,
  ...technological,
];


// =====================================================
// VALIDATION
// =====================================================

if (controls.length !== 93) {

  throw new Error(
    `[ISO27001] Expected 93 controls, found ${controls.length}`
  );

}


export const iso27001AnnexA = {

  id:
    frameworkId,

  name:
    "ISO/IEC 27001",

  version:
    "2022",

  status:
    "active",

  controlCount:
    controls.length,

  themes: {

    organisational:
      organisational.length,

    people:
      people.length,

    physical:
      physical.length,

    technological:
      technological.length,

  },

  controls,

};


export default iso27001AnnexA;