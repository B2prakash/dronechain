export const MOCK_DRONES = [
  {
    id: 'DRN-2026-001',
    model: 'DJI Mavic 3 Pro',
    serial: 'DJI-MV3-789456',
    owner: 'Vedprakash Singh',
    walletAddress: '8xK2...mN9p',
    location: { lat: 30.7333, lng: 76.7794 },
    altitude: 120,
    altitudeMSL: 440,
    speed: 45,
    heading: 270,
    battery: 78,
    status: 'active',
    compliance: 98,
    remoteIdActive: true,
    totalFlights: 47,
    registeredAt: '2026-01-15',
    purpose: 'Commercial Photography',
    weightClass: '250g-2kg',
    insurance: 'Valid until Dec 2026',
    pilotLicense: 'IND-DGCA-2026-4521',
    country: 'India',
    state: 'Punjab',
    city: 'Chandigarh',
  },
  {
    id: 'DRN-2026-002',
    model: 'DJI Phantom 4 RTK',
    serial: 'DJI-P4-123789',
    owner: 'Rahul Sharma',
    walletAddress: '3pL9...vK2m',
    location: { lat: 28.6139, lng: 77.2090 },
    altitude: 80,
    altitudeMSL: 296,
    speed: 32,
    heading: 90,
    battery: 45,
    status: 'active',
    compliance: 100,
    remoteIdActive: true,
    totalFlights: 123,
    registeredAt: '2025-11-20',
    purpose: 'Survey and Mapping',
    weightClass: '2kg-25kg',
    insurance: 'Valid until Jun 2026',
    pilotLicense: 'IND-DGCA-2025-1234',
    country: 'India',
    state: 'Delhi',
    city: 'New Delhi',
  },
  {
    id: 'DRN-2026-003',
    model: 'Parrot Anafi',
    serial: 'PAR-ANF-456123',
    owner: 'Priya Patel',
    walletAddress: '7mN3...xP1q',
    location: { lat: 19.0760, lng: 72.8777 },
    altitude: 0,
    altitudeMSL: 14,
    speed: 0,
    heading: 0,
    battery: 100,
    status: 'grounded',
    compliance: 92,
    remoteIdActive: false,
    totalFlights: 31,
    registeredAt: '2026-02-10',
    purpose: 'Hobby Photography',
    weightClass: '250g-2kg',
    insurance: 'Valid until Mar 2027',
    pilotLicense: 'IND-DGCA-2026-7890',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
  },
  {
    id: 'DRN-2026-004',
    model: 'Autel EVO II',
    serial: 'AUT-EVO-789012',
    owner: 'Amit Kumar',
    walletAddress: '2kP7...nL4r',
    location: { lat: 12.9716, lng: 77.5946 },
    altitude: 200,
    altitudeMSL: 920,
    speed: 67,
    heading: 180,
    battery: 23,
    status: 'violation',
    compliance: 45,
    remoteIdActive: true,
    totalFlights: 8,
    registeredAt: '2026-03-01',
    purpose: 'Delivery',
    weightClass: '2kg-25kg',
    insurance: 'Expired',
    pilotLicense: 'IND-DGCA-2026-3456',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
  },
  {
    id: 'DRN-2026-005',
    model: 'DJI Mini 3',
    serial: 'DJI-MN3-345678',
    owner: 'Sneha Gupta',
    walletAddress: '9qR1...mK8s',
    location: { lat: 22.5726, lng: 88.3639 },
    altitude: 60,
    altitudeMSL: 69,
    speed: 28,
    heading: 45,
    battery: 91,
    status: 'active',
    compliance: 100,
    remoteIdActive: true,
    totalFlights: 67,
    registeredAt: '2025-09-15',
    purpose: 'Wedding Photography',
    weightClass: 'Under 250g',
    insurance: 'Valid until Sep 2026',
    pilotLicense: 'IND-DGCA-2025-5678',
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
  },
]

export const MOCK_STATS = {
  totalDrones: 1247,
  activeFlights: 23,
  totalFlights: 47832,
  complianceRate: 99.8,
  countries: 47,
  violations: 3,
}

export type Violation = {
  id: string
  droneId: string
  ownerName: string
  type: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'Pending' | 'Paid' | 'Appealed'
  fine: string
  fineSol: number
  location: string
  city: string
  state: string
  time: string
  occurredAt: string
  evidence: string
}

export const MOCK_VIOLATIONS: Violation[] = [
  {
    id: 'VIO-2026-001',
    droneId: 'DRN-2026-004',
    ownerName: 'Amit Kumar',
    type: 'Altitude Limit Exceeded',
    severity: 'HIGH',
    status: 'Pending',
    fine: '0.5 SOL',
    fineSol: 0.5,
    location: 'Near Kempegowda Airport',
    city: 'Bangalore',
    state: 'Karnataka',
    time: 'Apr 18, 2026 14:32 IST',
    occurredAt: '2026-04-18T14:32:00+05:30',
    evidence: 'GPS coordinates 12.9716° N, 77.5946° E logged at 200m AGL',
  },
  {
    id: 'VIO-2026-002',
    droneId: 'DRN-2026-003',
    ownerName: 'Priya Patel',
    type: 'No Remote ID Broadcast',
    severity: 'MEDIUM',
    status: 'Pending',
    fine: '0.3 SOL',
    fineSol: 0.3,
    location: 'Marine Drive Promenade',
    city: 'Mumbai',
    state: 'Maharashtra',
    time: 'Apr 22, 2026 18:05 IST',
    occurredAt: '2026-04-22T18:05:00+05:30',
    evidence: 'Signal lost for 5 minutes near 19.0760° N, 72.8777° E',
  },
  {
    id: 'VIO-2026-003',
    droneId: 'DRN-2026-002',
    ownerName: 'Rahul Sharma',
    type: 'Restricted Zone Entry',
    severity: 'HIGH',
    status: 'Appealed',
    fine: '1.0 SOL',
    fineSol: 1.0,
    location: 'Parliament House perimeter',
    city: 'New Delhi',
    state: 'Delhi',
    time: 'Apr 12, 2026 10:18 IST',
    occurredAt: '2026-04-12T10:18:00+05:30',
    evidence: 'Drone crossed 2km no-fly boundary at 28.6139° N, 77.2090° E',
  },
  {
    id: 'VIO-2026-004',
    droneId: 'DRN-2026-005',
    ownerName: 'Sneha Gupta',
    type: 'Insurance Expired',
    severity: 'LOW',
    status: 'Paid',
    fine: '0.2 SOL',
    fineSol: 0.2,
    location: 'Howrah Bridge',
    city: 'Kolkata',
    state: 'West Bengal',
    time: 'Apr 02, 2026 09:14 IST',
    occurredAt: '2026-04-02T09:14:00+05:30',
    evidence: 'Insurance certificate expired 2 days before flight',
  },
]

export type ViolationType = {
  type: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'WARNING'
  fine: string
}

export const VIOLATION_TYPES: ViolationType[] = [
  {
    type: 'No Remote ID Broadcast',
    description: 'Drone not broadcasting required Remote ID data.',
    severity: 'HIGH',
    fine: '0.3 SOL',
  },
  {
    type: 'Restricted Zone Entry',
    description: 'Drone entered a designated no-fly zone.',
    severity: 'HIGH',
    fine: '1.0 SOL',
  },
  {
    type: 'Altitude Limit Exceeded',
    description: 'Flying above the legal altitude ceiling.',
    severity: 'HIGH',
    fine: '0.5 SOL',
  },
  {
    type: 'Weak Signal',
    description: 'Remote ID signal degraded below quality threshold.',
    severity: 'WARNING',
    fine: 'Warning only',
  },
  {
    type: 'Insurance Expired',
    description: 'Operating without a valid insurance certificate.',
    severity: 'LOW',
    fine: '0.2 SOL',
  },
]

export type NoFlyZone = {
  id: string
  name: string
  city: string
  radiusKm: number
  altitudeM: number
  status: 'Permanent' | 'Event'
  schedule?: string
}

export const NO_FLY_ZONES: NoFlyZone[] = [
  {
    id: 'NFZ-001',
    name: 'IGI Airport',
    city: 'Delhi',
    radiusKm: 5,
    altitudeM: 0,
    status: 'Permanent',
  },
  {
    id: 'NFZ-002',
    name: 'Kempegowda Airport',
    city: 'Bangalore',
    radiusKm: 3,
    altitudeM: 0,
    status: 'Permanent',
  },
  {
    id: 'NFZ-003',
    name: 'Parliament House',
    city: 'Delhi',
    radiusKm: 2,
    altitudeM: 60,
    status: 'Permanent',
  },
  {
    id: 'NFZ-004',
    name: 'Wankhede Cricket Stadium',
    city: 'Mumbai',
    radiusKm: 1,
    altitudeM: 120,
    status: 'Event',
    schedule: 'Apr 25 — Apr 28, 2026',
  },
]
