export type Place = {
  id: string
  name: string
  floor: string | null
  category: string | null
  images: string[]
  notes: string[]
}

export const PLACES: Place[] = [
  { id: 'main_office', name: '대학본부', floor: null, category: null, images: [], notes: ['분실물 보관 가능', '증명서 발급기 이용 가능'] },
  { id: 'dae101', name: '대101', floor: '1F', category: '강의실', images: ['/images/dae101.jpg'], notes: [] },
  { id: 'dae102', name: '대102', floor: '1F', category: '강의실', images: ['/images/dae102.jpg'], notes: [] },
  { id: 'dae103', name: '대103', floor: '1F', category: '강의실', images: ['/images/dae103.jpg'], notes: [] },
  { id: 'dae104', name: '대104', floor: '1F', category: '강의실', images: ['/images/dae104.jpg'], notes: [] },
  { id: 'dae105', name: '대105', floor: '1F', category: '강의실', images: ['/images/dae105.jpg'], notes: [] },
  { id: 'dae106', name: '대106', floor: '1F', category: '강의실', images: ['/images/dae106.jpg'], notes: [] },
  { id: 'dae107', name: '대107', floor: '1F', category: '강의실', images: ['/images/dae107.jpg'], notes: [] },
  { id: 'dae108', name: '대108', floor: '1F', category: '강의실', images: ['/images/dae108.jpg'], notes: [] },
  { id: 'dae202', name: '대202', floor: '2F', category: '강의실', images: ['/images/dae202.jpg'], notes: [] },
  { id: 'dae203', name: '대203', floor: '2F', category: '강의실', images: ['/images/dae203.jpg'], notes: [] },
  { id: 'dae204', name: '대204', floor: '2F', category: '강의실', images: ['/images/dae204.jpg'], notes: [] },
  { id: 'dae205', name: '대205', floor: '2F', category: '강의실', images: ['/images/dae205.jpg'], notes: [] },
  { id: 'dae2Fsofa1', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa1.jpg'], notes: [] },
  { id: 'dae2Fsofa2', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa2.jpg'], notes: [] },
  { id: 'dae2Fsofa3', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa3.jpg'], notes: [] },
  { id: 'dae2Fsofa4', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa4.jpg'], notes: [] },
  { id: 'dae2Fsofa5', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa5.jpg'], notes: [] },
  { id: 'dae2Fsofa6', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa6.jpg'], notes: [] },
  { id: 'dae2Fsofa7', name: '대강의동 2층 소파', floor: '2F', category: '복합공간', images: ['/images/dae2Fsofa7.jpg'], notes: [] },
  { id: 'dae2Fwater', name: '대강의동 2층 정수기', floor: '2F', category: '편의시설', images: [], notes: [] },
  { id: 'chaB1', name: '박물관', floor: 'B1', category: '강의실', images: [], notes: [] },
  { id: 'cha119', name: '차119', floor: '1F', category: '강의실', images: ['/images/cha119.jpg'], notes: ['멀티미디어강의실'] },
  { id: 'cha120', name: '차120', floor: '1F', category: '강의실', images: ['/images/cha120.jpg'], notes: ['디지털소프트웨어공학부 실습실'] },
  { id: 'cha121', name: '차121', floor: '1F', category: '강의실', images: ['/images/cha121.jpg'], notes: [] },
  { id: 'cha122', name: '차122', floor: '1F', category: '강의실', images: ['/images/cha122.jpg'], notes: [] },
  { id: 'cha123', name: '차123', floor: '1F', category: '강의실', images: ['/images/cha123.jpg'], notes: [] },
  { id: 'cha124', name: '차124', floor: '1F', category: '강의실', images: ['/images/cha124.jpg'], notes: [] },
  { id: 'cha125', name: '차125', floor: '1F', category: '강의실', images: ['/images/cha125.jpg'], notes: ['기후데이터 분석 및 실습실'] },
  { id: 'cha126', name: '차126', floor: '1F', category: '강의실', images: ['/images/cha126.jpg', '/images/cha126-1.jpg'], notes: ['글로벌커뮤니케이션센터', '차미리사교양교육연구소'] },
  { id: 'cha127', name: '차127', floor: '1F', category: '강의실', images: ['/images/cha127.jpg', '/images/cha127-1.jpg'], notes: ['차미리사교양대학 교학과', '차미리사교양대학 학장실'] },
  { id: 'cha128', name: '차128', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha129', name: '차129', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha130', name: '차130', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha131', name: '차131', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha132', name: '차132', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha133', name: '차133', floor: '1F', category: '강의실', images: [], notes: ['연구실 구역'] },
  { id: 'cha134', name: '차134', floor: '1F', category: '강의실', images: ['/images/cha134.jpg'], notes: ['입학상담실'] },
  { id: 'cha135', name: '차135', floor: '1F', category: '강의실', images: ['/images/cha135.jpg'], notes: ['연구실 구역'] },
  { id: 'cha136', name: '차136', floor: '1F', category: '강의실', images: ['/images/cha136.jpg'], notes: [] },
  { id: 'cha137', name: '차137', floor: '1F', category: '강의실', images: ['/images/cha137.jpg'], notes: [] },
  { id: 'cha138', name: '차138', floor: '1F', category: '강의실', images: ['/images/cha138.jpg'], notes: [] },
  { id: 'cha139', name: '차139', floor: '1F', category: '강의실', images: ['/images/cha139.jpg'], notes: [] },
  { id: 'cha140', name: '차140', floor: '1F', category: '강의실', images: ['/images/cha140.jpg'], notes: ['연구실 구역'] },
  { id: 'cha141', name: '차141', floor: '1F', category: '강의실', images: ['/images/cha141.jpg'], notes: ['연구실 구역'] },
  { id: 'cha142', name: '차142', floor: '1F', category: '강의실', images: ['/images/cha142.jpg'], notes: ['연구실 구역'] },
  { id: 'cha143', name: '차143', floor: '1F', category: '강의실', images: ['/images/cha143-147.jpg'], notes: [] },
  { id: 'cha144', name: '차144', floor: '1F', category: '강의실', images: ['/images/cha143-147.jpg'], notes: [] },
  { id: 'cha145', name: '차145', floor: '1F', category: '강의실', images: ['/images/cha143-147.jpg'], notes: [] },
  { id: 'cha146', name: '차146', floor: '1F', category: '강의실', images: ['/images/cha143-147.jpg'], notes: [] },
  { id: 'cha147', name: '차147', floor: '1F', category: '강의실', images: ['/images/cha143-147.jpg'], notes: [] },
  { id: 'cha1Fsofa', name: '차미리사관 1층 소파', floor: '1F', category: '복합공간', images: ['/images/cha1Fsota.jpg'], notes: [] },
  { id: 'cha1Fprinter', name: '차미리사관 1층 프린터', floor: '1F', category: '편의시설', images: ['/images/cha1Fprinter.jpg'], notes: ['흑백 프린트만 가능'] },
  { id: 'cha1Fwater', name: '차미리사관 1층 정수기', floor: '1F', category: '편의시설', images: [], notes: [] },
  { id: 'cha1Fdrink', name: '차미리사관 1층 자판기', floor: '1F', category: '편의시설', images: [], notes: [] },
  // 2F
  { id: 'cha219', name: '차219', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha220', name: '차220', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha221', name: '차221', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha222', name: '차222', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha223', name: '차223', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha224', name: '차224', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha225', name: '차225', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha226', name: '차226', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha227', name: '차227', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha228', name: '차228', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha229', name: '차229', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha230', name: '차230', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha231', name: '차231', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha232', name: '차232', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha233', name: '차233', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha234', name: '차234', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha235', name: '차235', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha236', name: '차236', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha237', name: '차237', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha238', name: '차238', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha239', name: '차239', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha242', name: '차242', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha243', name: '차243', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha244', name: '차244', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha245', name: '차245', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha246', name: '차246', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha247', name: '차247', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha248', name: '차248', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha249', name: '차249', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha250', name: '차250', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha251', name: '차251', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha252', name: '차252', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha253', name: '차253', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha254', name: '차254', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha255', name: '차255', floor: '2F', category: '강의실', images: [], notes: [] },
  { id: 'cha256', name: '차256', floor: '2F', category: '강의실', images: [], notes: [] },
  // 3F
  { id: 'cha319', name: '차319', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha320', name: '차320', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha321', name: '차321', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha323', name: '차323', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha324', name: '차324', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha325', name: '차325', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha326', name: '차326', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha327', name: '차327', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha328', name: '차328', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha329', name: '차329', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha330', name: '차330', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha331', name: '차331', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha332', name: '차332', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha333', name: '차333', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha334', name: '차334', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha335', name: '차335', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha336', name: '차336', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha337', name: '차337', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha338', name: '차338', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha339', name: '차339', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha340', name: '차340', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha341', name: '차341', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha342', name: '차342', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha343', name: '차343', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha344', name: '차344', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha345', name: '차345', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha346', name: '차346', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha347', name: '차347', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha348', name: '차348', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha349', name: '차349', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha350', name: '차350', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha351', name: '차351', floor: '3F', category: '강의실', images: [], notes: [] },
  { id: 'cha352', name: '차352', floor: '3F', category: '강의실', images: [], notes: [] },
  // 4F
  { id: 'cha419', name: '차419', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha420', name: '차420', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha421', name: '차421', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha422', name: '차422', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha423', name: '차423', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha424', name: '차424', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha425', name: '차425', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha426', name: '차426', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha427', name: '차427', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha428', name: '차428', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha429', name: '차429', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha430', name: '차430', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha431', name: '차431', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha432', name: '차432', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha433', name: '차433', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha434', name: '차434', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha435', name: '차435', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha436', name: '차436', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha437', name: '차437', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha438', name: '차438', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha439', name: '차439', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha440', name: '차440', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha441', name: '차441', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha442', name: '차442', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha443', name: '차443', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha444', name: '차444', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha445', name: '차445', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha446', name: '차446', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha447', name: '차447', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha448', name: '차448', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha449', name: '차449', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha450', name: '차450', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha451', name: '차451', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha452', name: '차452', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha453', name: '차453', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha454', name: '차454', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha455', name: '차455', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha456', name: '차456', floor: '4F', category: '강의실', images: [], notes: [] },
  { id: 'cha457', name: '차457', floor: '4F', category: '강의실', images: [], notes: [] },
]

export type BuildingConfig = {
  id: string
  label: string
  svgId: string
  prefix: string
}

export const BUILDINGS: BuildingConfig[] = [
  { id: '전체', label: '전체', svgId: '', prefix: '' },
  { id: 'cha', label: '차미리사관', svgId: 'building-cha', prefix: 'cha' },
  { id: 'hum', label: '인문사회관', svgId: 'building-hum', prefix: 'hum' },
  { id: 'dae', label: '대강의동', svgId: 'building-dae', prefix: 'dae' },
  { id: 'nat', label: '자연관', svgId: 'building-nat', prefix: 'nat' },
  { id: 'stu', label: '학생회관', svgId: 'building-stu', prefix: 'stu' },
]

export function getPlacesByBuilding(buildingId: string): Place[] {
  if (buildingId === '전체') return PLACES
  const building = BUILDINGS.find(b => b.id === buildingId)
  if (!building || !building.prefix) return []
  return PLACES.filter(p => p.id.startsWith(building.prefix))
}

export function searchPlaces(query: string): Place[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return PLACES.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.floor?.toLowerCase().includes(q) ?? false) ||
    (p.category?.toLowerCase().includes(q) ?? false) ||
    p.notes.some(n => n.toLowerCase().includes(q))
  )
}

export function getBuildingLabel(place: Place): string {
  if (place.id.startsWith('cha')) return '차미리사관'
  if (place.id.startsWith('dae')) return '대강의동'
  if (place.id === 'main_office') return '대학본부'
  return '기타'
}

// ── MapPage 전용 설정 ────────────────────────────────────────

export type FloorCfg = { key: string; label: string }
export type ViewKey = 'basic' | 'locker' | 'amenity'

export type BuildingMapCfg = {
  id: string
  subId: string
  label: string
  floors: FloorCfg[]
  views: ViewKey[]
  viewOverrides?: Partial<Record<string, ViewKey[]>>
  subs?: BuildingMapCfg[]
}

export const BUILDING_MAP_CONFIG: BuildingMapCfg[] = [
  {
    id: 'cha', subId: 'cha', label: '차미리사관',
    floors: [
      { key: 'b1', label: 'B1F' }, { key: '1', label: '1F' },
      { key: '2', label: '2F' }, { key: '3', label: '3F' }, { key: '4', label: '4F' },
    ],
    views: ['basic', 'locker', 'amenity'],
  },
  {
    id: 'hum', subId: 'hum', label: '인문사회관',
    floors: [
      { key: '1', label: '1F' }, { key: '2', label: '2F' },
      { key: '3', label: '3F' }, { key: '4', label: '4F' },
    ],
    views: ['basic', 'locker', 'amenity'],
  },
  {
    id: 'dae', subId: 'dae', label: '대강의동',
    floors: [{ key: '1', label: '1F' }, { key: '2', label: '2F' }],
    views: ['basic', 'locker', 'amenity'],
  },
  {
    id: 'nat', subId: '', label: '자연관', floors: [], views: [],
    subs: [
      {
        id: 'natA', subId: 'natA', label: 'A동',
        floors: [
          { key: '1', label: '1F' }, { key: '2', label: '2F' },
          { key: '3', label: '3F' }, { key: '4', label: '4F' },
        ],
        views: ['basic', 'locker'],
      },
      {
        id: 'natB', subId: 'natB', label: 'B동',
        floors: [{ key: '1', label: '1F' }, { key: '2', label: '2F' }],
        views: ['basic', 'locker', 'amenity'],
        viewOverrides: { '1': ['basic', 'locker'] },
      },
      {
        id: 'natC', subId: 'natC', label: 'C동',
        floors: [
          { key: '1', label: '1F' }, { key: '2', label: '2F' }, { key: '3', label: '3F' },
        ],
        views: ['basic', 'locker'],
      },
    ],
  },
  {
    id: 'stu', subId: 'stu', label: '학생회관',
    floors: [
      { key: '1', label: '1F' }, { key: '2', label: '2F' },
      { key: '3', label: '3F' }, { key: '4', label: '4F' },
    ],
    views: ['basic', 'amenity'],
  },
]

export function getBuildingMapCfg(buildingId: string): BuildingMapCfg | undefined {
  return BUILDING_MAP_CONFIG.find(b => b.id === buildingId)
}

export function getFloorViews(cfg: BuildingMapCfg, floorKey: string): ViewKey[] {
  return cfg.viewOverrides?.[floorKey] ?? cfg.views
}
