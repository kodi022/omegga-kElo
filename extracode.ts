import {BrickV10, BrsV10, OmeggaPlayer} from 'omegga';

export type GlobalStats = { 
  data:{elo: number, winrate: number}, //elo should go from 0 to max 9999 or somn
  data2:{kills: number, wins: number, losses: number},
  data3:{cash: number, level: number, xp: number,},
  minidata:{mininame: string, ministats: PerMiniSetting}[],
  loadout:{primary: number, secondary: number, tertiary: number}
  name: string,
}
export type PerMiniSetting = {
  data:{elo: number, winrate: number}, 
  data2:{wins: number, losses: number}
}
export type MiniSetting = { 
  name: string, 
  owner_identifier: string,
  matchmaked: boolean, 
  ranked: boolean, 
  tracking: boolean, 
  plr_threshold: number, 
  teams: { team: string, players: OmeggaPlayer[] }[] 
}
export type TeamStats = {
  team: string, 
  elo: number, 
  winrate: number, 
  alive: boolean, 
  players: string[]
}
export type Weapon = { 
 name: string, weapon: string, scale: number
}
export type User = {
  name:'Elo', 
  id:'9dc94af3-913e-41cd-8f37-b71f3828d001'
}

export const elo_range: number = 100;
export const blacklist_minis: string[] = [
  "global",
  "spec"
]
export const spawn_offsets: [number,number,number][] = [
  [0,0,-200],
  [50,0,-200],
  [0,50,-200],
  [-50,0,-200],
  [0,-50,-200],
]

// "Weapon_AntiMaterielRifle" | "Weapon_ArmingSword" | "Weapon_AssaultRifle" | 
// "Weapon_AutoShotgun" | "Weapon_Battleaxe" | "Weapon_Bazooka" | "Weapon_Bow" | "Weapon_BullpupRifle" | 
// "Weapon_BullpupSMG" | "Weapon_ChargedLongsword" | "Weapon_CrystalKalis" | "Weapon_Derringer" | 
// "Weapon_FlintlockPistol" | "Weapon_GrenadeLauncher" | "Weapon_Handaxe" | "Weapon_HealthPotion" | 
// "Weapon_HeavyAssaultRifle" | "Weapon_HeavySMG" | "Weapon_HeroSword" | "Weapon_HighPowerPistol" | 
// "Weapon_HoloBlade" | "Weapon_HuntingShotgun" | "Weapon_Ikakalaka" | "Weapon_ImpactGrenade" | 
// "Weapon_ImpactGrenadeLauncher" | "Weapon_ImpulseGrenade" | "Weapon_Khopesh" | "Weapon_Knife" | 
// "Weapon_LeverActionRifle" | "Weapon_LightMachineGun" | "Weapon_LongSword" | "Weapon_MagnumPistol" | 
// "Weapon_MicroSMG" | "Weapon_Minigun" | "Weapon_Pistol" | "Weapon_PulseCarbine" | "Weapon_QuadLauncher" | 
// "Weapon_Revolver" | "Weapon_RocketJumper" | "Weapon_RocketLauncher" | "Weapon_Sabre" | "Weapon_SemiAutoRifle" | 
// "Weapon_ServiceRifle" | "Weapon_Shotgun" | "Weapon_SlugShotgun" | "Weapon_SniperRifle" | "Weapon_Spatha" | 
// "Weapon_SubmachineGun_Unsuppressed" | "Weapon_StickGrenade" | "Weapon_SubmachineGun" | "Weapon_SuperShotgun" | 
// "Weapon_SuppressedAssaultRifle" | "Weapon_SuppressedBullpupSMG" | "Weapon_SuppressedPistol" | 
// "Weapon_SuppressedServiceRifle" | "Weapon_TacticalShotgun" | "Weapon_TacticalSMG" | "Weapon_Tomahawk" | 
// "Weapon_TwinCannon" | "Weapon_TypewriterSMG" | "Weapon_Zweihander";

export const primaries: Weapon[] = [
  {name:"None", weapon:"None", scale: 0}, 
  // rifles
  {name:"AssaultRifle", weapon:"BP_ItemPickup_AssaultRifle", scale: 0.9}, 
  {name:"ServiceRifle", weapon:"BP_ItemPickup_ServiceRifle", scale: 0.8},
  {name:"BullpupRifle", weapon:"BP_ItemPickup_BullpupRifle", scale: 1}, 
  {name:"ClassicAR", weapon:"BP_ItemPickup_HeavyAssaultRifle", scale: 0.8},
  {name:"LightMachineGun", weapon:"BP_ItemPickup_LightMachineGun", scale: 0.8}, 
  {name:"PulseCarbine", weapon:"BP_ItemPickup_PulseCarbine", scale: 0.8}, 
  // smgs
  {name:"TacticalSMG", weapon:"BP_ItemPickup_TacticalSMG", scale: 1.1}, 
  {name:"TommyGun", weapon:"BP_ItemPickup_TypewriterSMG", scale: 1.1},
  {name:"SMGUnsuppressed", weapon:"BP_ItemPickup_SubmachineGun_Unsuppressed", scale: 1},
  // shotguns
  {name:"SlugShotgun", weapon:"BP_ItemPickup_SlugShotgun", scale: 0.7}, 
  {name:"PumpShotgun", weapon:"BP_ItemPickup_Shotgun", scale: 1}, 
  {name:"TacticalShotgun", weapon:"BP_ItemPickup_TacticalShotgun", scale: 0.9},
  // snipers
  {name:"LeverAction", weapon:"BP_ItemPickup_LeverActionRifle", scale: 0.8}, 
  {name:"SemiAutoRifle", weapon:"BP_ItemPickup_SemiAutoRifle", scale: 0.9},
  {name:"Sniper", weapon:"BP_ItemPickup_SniperRifle", scale: 0.8},
  // pistol
  {name:"Pistol", weapon:"BP_ItemPickup_Pistol", scale: 1.2},
  // more
  {name:"Bazooka", weapon:"BP_ItemPickup_Bazooka", scale: 0.5}, 
  {name:"Bow (best weapon)", weapon:"BP_ItemPickup_Bow", scale: 1.1}, 
  {name:"HealthPotion", weapon:"BP_ItemPickup_HealthPotion", scale: 1.5},
];
export const secondaries: Weapon[] = [
  {name:"None", weapon:"None", scale: 0}, 
  // pistols
  {name:"Pistol", weapon:"BP_ItemPickup_Pistol", scale: 1}, 
  {name:"Revolver", weapon:"BP_ItemPickup_Revolver", scale: 0.9},
  {name:"HiPowerPistol", weapon:"BP_ItemPickup_HighPowerPistol", scale: 0.9}, 
  {name:"SmolDeagle", weapon:"BP_ItemPickup_MagnumPistol", scale: 0.6},
  {name:"Derringer", weapon:"BP_ItemPickup_Derringer", scale: 1.4},
  // smgs
  {name:"BullpupSMG", weapon:"BP_ItemPickup_BullpupSMG", scale: 1}, 
  {name:"MicroSMG", weapon:"BP_ItemPickup_MicroSMG", scale: 1},
  {name:"HeavySMG", weapon:"BP_ItemPickup_HeavySMG", scale: 1.1}/*nerf next patch*/ ,
  // shotguns
  {name:"AutoShotgun", weapon:"BP_ItemPickup_AutoShotgun", scale: 0.7},
  // melee
  {name:"Handaxe", weapon:"BP_ItemPickup_Handaxe", scale: 1.1},
  {name:"HealthPotion", weapon:"BP_ItemPickup_HealthPotion", scale: 1.1},
];
export const tertiaries: Weapon[] = [
  {name:"None", weapon:"None", scale: 0}, 
  // pistol
  {name:"Pistol", weapon:"BP_ItemPickup_Pistol", scale: 0.6}, 
  {name:"Derringer", weapon:"BP_ItemPickup_Derringer", scale: 0.8},
  // melee
  {name:"British", weapon:"BP_ItemPickup_Knife", scale: 1.2}, 
  {name:"Battleaxe", weapon:"BP_ItemPickup_Battleaxe", scale: 1},
  {name:"LongSword", weapon:"BP_ItemPickup_LongSword", scale: 1},
  {name:"HoloBlade", weapon:"BP_ItemPickup_HoloBlade", scale: 1},
  // misc
  {name:"HealthPotion", weapon:"BP_ItemPickup_HealthPotion", scale: 0.8},
  {name:"StickGrenade", weapon:"BP_ItemPickup_StickGrenade", scale: 0.8}, 
  {name:"ImpactGrenade", weapon:"BP_ItemPickup_ImpactGrenade", scale: 0.5},
  {name:"ImpulseGrenade", weapon:"BP_ItemPickup_ImpulseGrenade", scale: 0.5},
];

export let save: BrsV10 = {
  game_version: 10,
  version: 10,
  map:'plate', 
  save_time: new Uint8Array(),
  host:{name:"Elo", id:"ffffffff-ffff-ffff-ffff-b71f3828d001"},
  author:{name:"Elo", id:"ffffffff-ffff-ffff-ffff-b71f3828d001"},
  description:'description',
  brick_count: 3,
  brick_assets: ['PB_DefaultMicroBrick'],
  brick_owners: [{name:"Elo", id:"ffffffff-ffff-ffff-ffff-b71f3828d001", bricks: 0}],
  materials: ["BMC_Plastic"],
  physical_materials: [],
  mods: [],
  colors: [[255,255,255,255]],
  components: {	BCD_ItemSpawn: {
    version: 1,
    properties: {
      PickupClass: "Class", bPickupEnabled: "Boolean", bPickupRespawnOnMinigameReset: "Boolean",
      PickupMinigameResetRespawnDelay: "Float", bPickupAutoDisableOnPickup: "Boolean", PickupRespawnTime: "Float",
      PickupOffsetDirection: "Byte", PickupOffsetDistance: "Float", PickupRotation: "Rotator", PickupScale: "Float",
      bPickupAnimationEnabled: "Boolean", PickupAnimationAxis: "Byte", bPickupAnimationAxisLocal: "Boolean",
      PickupSpinSpeed: "Float", PickupBobSpeed: "Float", PickupBobHeight: "Float", PickupAnimationPhase: "Float",
    },
  }, },
  bricks: []
}

export let brick: BrickV10 = {
  asset_name_index: 0,
  size: [2,2,2],
  position: [0,0,0],
  direction: 4,
  rotation: 0,
  collision: {player:false, weapon:false, interaction:false, tool:true},
  visibility: false,
  color: 0,
  material_index: 0,
  owner_index: 1,
  components: {BCD_ItemSpawn:{PickupClass:"BP_ItemPickup_MagnumPistol",bPickupEnabled:true,bPickupRespawnOnMinigameReset:true,
  PickupMinigameResetRespawnDelay:0,bPickupAutoDisableOnPickup:true,PickupRespawnTime:50,PickupOffsetDirection:4,
  PickupOffsetDistance:0,PickupRotation:[0,45,90],PickupScale:1,bPickupAnimationEnabled:false,PickupAnimationAxis:2,
  bPickupAnimationAxisLocal:false,PickupSpinSpeed:0.5,PickupBobSpeed:0.5,PickupBobHeight:4,
  PickupAnimationPhase:0.5}},
  physical_index: 0,
  material_intensity: 0,
}