import recursivelyMerge from './recursivelyMerge';

export default class Unit {
  constructor(unitType, country) {
    this.unitType = unitType;
    this.country = country;

    this.missingEquipment = new Set();
    this.equipment = new Map();
    for(let name in unitType.equipment) {
      let count = unitType.equipment[name];
      let equipment = country.equipmentMap[name];
      if(equipment) {
        this.equipment.set(equipment, count);
      } else {
        let fallbackEquipment = country.db.fallbackEquipmentMap[name];
        if(!fallbackEquipment) {
          throw new Error(`Can't find ${name}`);
        }
        this.equipment.set(fallbackEquipment, count);
        this.missingEquipment.add(fallbackEquipment.name);
      }
    }
    this.country_bonuses = country.unitBonusesFor(unitType.key);
  }

  group() {
    return this.unitType.group;
  }

  suppression() {
    return this.calculateFromUnitTypeAndBonus("suppression");
  }

  suppression_factor() {
    return this.calculateFromUnitTypeAndBonus("suppression_factor");
  }

  hp() {
    return this.unitType.hp;
  }

  supply_use() {
    return this.unitType.supply_use;
  }

  manpower() {
    return this.unitType.manpower;
  }

  training_time() {
    return this.unitType.training_time;
  }

  weight() {
    return this.unitType.weight;
  }

  special_forces() {
    return this.unitType.special_forces;
  }

  can_be_parachuted() {
    return this.unitType.can_be_parachuted;
  }

  name() {
    return this.unitType.name;
  }

  org() {
    let base = this.unitType.org;
    return base + (this.country_bonuses["max_organisation"] || 0)
  }

  recovery_rate() {
    let base = this.unitType.recovery_rate;
    return base + (this.country_bonuses["default_morale"] || 0)
  }

  reliability_factor() {
    return this.calculateFromUnitTypeAndBonus("reliability_factor");
  }

  casualty_trickleback() {
    return this.calculateFromUnitTypeAndBonus("casualty_trickleback");
  }

  experience_loss_factor() {
    return this.calculateFromUnitTypeAndBonus("experience_loss_factor");
  }

  initiative() {
    return this.calculateFromUnitTypeAndBonus("initiative");
  }

  equipment_capture_factor() {
    return this.calculateFromUnitTypeAndBonus("equipment_capture_factor")
  }

  supply_consumption_factor() {
    return this.calculateFromUnitTypeAndBonus("supply_consumption_factor")
  }

  combat_width() {
    return this.calculateFromUnitTypeAndBonus("combat_width");
  }

  recon() {
    return this.calculateFromUnitTypeAndBonus("recon")
  }

  entrenchment() {
    return this.calculateFromUnitTypeAndBonus("entrenchment")
  }

  soft_attack() {
    return this.calculateFromEquipmentAndBonusMult("soft_attack")
  }

  hard_attack() {
    return this.calculateFromEquipmentAndBonusMult("hard_attack")
  }

  air_attack() {
    return this.calculateFromEquipmentAndBonusMult("air_attack")
  }

  defense() {
    return this.calculateFromEquipmentAndBonusMult("defense")
  }

  breakthrough() {
    return this.calculateFromEquipmentAndBonusMult("breakthrough")
  }

  piercing() {
    return this.calculateFromEquipmentAndBonusMult("ap_attack")
  }

  armor() {
    // never any bonus, but doesn't hurt
    return this.calculateFromEquipmentAndBonusMult("armor_value")
  }

  hardness() {
    return this.calculateFromEquipmentAndBonusMult("hardness")
  }

  calculateFromUnitTypeAndBonus(stat) {
    let base = this.unitType[stat] || 0;
    return base + (this.country_bonuses[stat] || 0)
  }

  calculateFromEquipmentAndBonus(stat) {
    let base = 0;
    for(let equipment of this.equipment.keys()) {
      base += equipment[stat];
    }
    return base + (this.country_bonuses[stat] || 0)
  }

  calculateFromEquipmentAndBonusMult(stat) {
    let base = 0;
    for(let equipment of this.equipment.keys()) {
      base += (equipment[stat] || 0);
    }

    return base * (1 + (this.unitType[stat] || 0) + (this.country_bonuses[stat] || 0))
  }

  ic_cost() {
    let result = 0;
    for(let [equipment, count] of this.equipment) {
      result += equipment.build_cost_ic * count;
    }
    return result;
  }

  speed() {
    // Unclear what to do when multiply types are used. Mot uses mot(12)+inf(4)
    let equipment = [...this.equipment.keys()]
    let equipmentSpeeds = equipment.map(e => e.maximum_speed).filter(s => s);
    let equipmentSpeed = equipmentSpeeds.length ? Math.max(...equipmentSpeeds) : 4.0;
    return equipmentSpeed * (1 + this.unitType.maximum_speed || 0)
  }

  terrain_bonuses() {
    let result = {};
    recursivelyMerge(result, this.unitType.terrain_bonuses);
    if(this.country_bonuses.terrain_bonuses) {
      recursivelyMerge(result, this.country_bonuses.terrain_bonuses);
    }
    return result;
  }
}
