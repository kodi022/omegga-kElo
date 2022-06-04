import OmeggaPlugin, {OL, PS, PC, ILogMinigame, OmeggaPlayer} from 'omegga';
import {save, GlobalStats, MiniSetting, PerMiniSetting, primaries, secondaries, tertiaries, Weapon, blacklist_minis, elo_range, TeamStats} from './extracode';
type Config = { foo: string };
type Storage = { bar: string };

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;
  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  // ---- TO-DO ----
  // proper round end conditions perhaps

  async init() 
  {
    const minigame_events = await this.omegga.getPlugin("minigameevents");
    if (minigame_events) {
      console.log('subscribing to minigameevents');
      minigame_events.emitPlugin('subscribe', []);
    } else throw Error("minigameevents plugin is required for this to plugin");

    this.omegga.on('join', async (joiner: OmeggaPlayer) => { //global data
      setTimeout( async() => 
      {
        await this.setup_stats(joiner.name, false);
      }, 150);
    });

    this.auth = this.config["Authorized-Users"];
    this.leave_mini = this.config["Leave-Mini"];
    this.debug = this.config["Enable-Debug"];
    this.print_kills = this.config["Print-Kills"];

    this.omegga.on('cmd:helpelo', async (speaker: string, number: number) => 
    {
      this.commands_help(speaker, number);
    });
    this.omegga.on('cmd:stats', async (speaker: string, name:string) => 
    {
      await this.stats_show(speaker, name, false);
    });
    this.omegga.on('cmd:ministats', async (speaker: string, name:string) => 
    {
      await this.stats_show(speaker, name, true);
    });
    this.omegga.on('cmd:top', async (speaker: string, number: number) => 
    {
      await this.show_top(speaker, false);
    });
    this.omegga.on('cmd:minitop', async (speaker: string, number:number) => 
    {
      await this.show_top(speaker, true);
    });
    this.omegga.on('cmd:refreshminis', async (speaker: string) => 
    {
      await this.update_minigames();
    });
    this.omegga.on('cmd:l', async (speaker: string, slot: string, option: string) => // loadout
    {
      await this.loadout_change(speaker, slot, option);
    });
    this.omegga.on('cmd:printobject', async (speaker: string, name :string) => 
    {
      let p: OmeggaPlayer;
      if (name) p = this.omegga.findPlayerByName(name);
      else p = this.omegga.getPlayer(speaker);
      this.omegga.whisper(speaker, "ran printobject");
      let obj:GlobalStats = await this.store.get<any>(`Player-${p.name}`);
      console.log(JSON.stringify(obj.data)); // JSON.stringify breaks it wtf
    });
    this.omegga.on('cmd:resetstats', async (speaker: string, name: string) => 
    {
      let plr: string = "";
      if (name != "") 
      {
        let plr_obj = this.omegga.findPlayerByName(name);
        if (plr_obj) plr = plr_obj.name;
      } else plr = speaker;
      if (plr != "") await this.setup_stats(plr, true);
    });
    this.omegga.on('cmd:editstats', async (speaker: string, name: string, all: boolean) => 
    {
      let plr: string = "";
      if (name != "") 
      {
        let plr_obj = this.omegga.findPlayerByName(name);
        if (plr_obj) plr = plr_obj.name;
      } else plr = speaker;
      if (plr != "") await this.setup_stats(plr, true);
    });
    this.omegga.on('cmd:clearallstore', (speaker: string) => 
    {
      if (this.auth.find(p => p.name === speaker)) 
      {
        this.store.wipe();
        this.omegga.broadcast("Cleared ALL STORE!!!!!!");
      } else 
      {
        this.omegga.whisper(speaker, "You are not authorized");
        console.warn(`${speaker} tried to run clearallstore`);
      }
    });
    await this.update_minigames();
    return {registeredCommands: ['helpelo','stats','top','ministats','minitop','refreshminis','l','clearallstore','printobject','resetstats', 'editstats']};
  }

  minigame_settings: MiniSetting[] = []; // very very important variable

  auth: OmeggaPlayer[] = [];
  leave_mini: OmeggaPlayer[] = [];
  debug:boolean = false;
  print_kills:boolean = false;

  async stats_show(speaker:string, name:string, mini:boolean) // Prints stats of player or selected name, with specific mini option
  {
    let store_obj:GlobalStats;
    let mini_obj: {mininame: string, ministats: PerMiniSetting};
    let plr:OmeggaPlayer;
    if (name) plr = this.omegga.findPlayerByName(name) || undefined;
    else plr = this.omegga.getPlayer(speaker) || undefined;
    if (!plr) {this.omegga.whisper(speaker, "Player not found."); return;}

    if (mini) // get mini infos
    {
      let mini = this.get_mini(plr.name); // get players mini
      if (!mini) {this.omegga.whisper(speaker, "Minigame not found."); return;}

      store_obj = await this.store.get<any>(`Player-${plr.name}`); // get players stats
      if (!store_obj) {this.omegga.whisper(speaker, "Store object not found."); return;}

      mini_obj = store_obj.minidata.find(m => m.mininame === mini); // get players mini stats
      if (!mini_obj) {this.omegga.whisper(speaker, "Minigame stats not found."); return;}
    } else // get global infos
    {
      if (!plr) {this.omegga.whisper(speaker, "Player not found."); return;}
      store_obj = await this.store.get<any>(`Player-${plr.name}`) || undefined;
    }
    
    // print infos
    let target: string;
    if (plr.name !== speaker) target = `${plr.name}'s Stats`;
    else target = "Your Stats";

    let iterate;
    let minie: string;
    if (mini) 
    {
      iterate = mini_obj.ministats;
      minie = `for ${mini_obj.mininame}`;
    } else 
    {
      iterate = store_obj;
      minie = "";
    }

    this.font_print(`<u>${target}</> ${minie}`, speaker, 18, "fa0", true);
    for (let d of Object.keys(iterate))
    {
      if (d === "minidata") return;
      let data: string = "";
      for (let k of Object.keys(iterate[d])) 
      {
        let spaces1: string = " ";
        let spaces2: string = " ";

        let value = iterate[d][k];
        if (k === 'winrate') value = (value * 100).toString().slice(0, 5) + "%";
        else if (k === 'elo') value = value = value.toString().slice(0, 6);

        if (value < 0) 
        {
          spaces1 = spaces1.repeat((7 - 1) - k.length);
          spaces2 = spaces2.repeat(((7 + 1) - value.toString().length));
        }else 
        {
          spaces1 = spaces1.repeat(7 - k.length);
          spaces2 = spaces2.repeat((7- value.toString().length));
        }
        let new_string: string = `<color="fff">${k}:</>${spaces1}${value}${spaces2}`;
        data = data + new_string;
      }
      this.font_print(`${data}`, speaker, 14, "bf7", true);
      data = "";
    }
  }

  async show_top(speaker: string, minigame: boolean) // Prints top players, with specific mini option
  {
    if (minigame) 
    {


    } else 
    {

    }
  }

  async round_end_update(minigame: string) // Updates players in minigame and if ranking is enabled at new round
  {
    if (this.is_minigame_not_pvp(minigame)) return;
    if (this.debug) this.omegga.broadcast("round_end_update() ran");
    let mini = this.minigame_settings.find(m => m.name === minigame);
    if (mini) 
    {
      let player_amount: number = 0;
      for (let t of mini.teams) 
      {
        player_amount += t.players.length;
      }
      if (mini.ranked) 
      {
        if (mini.plr_threshold <= player_amount)
        {
          mini.tracking = true;
          this.print_to_mini(mini.name, `Ranking enabled for minigame`, 14, "2f2");
        } else 
        {
          this.print_to_mini(mini.name, `Not enough players for ranking`, 14, "a22");
        }
      }
    } else {this.omegga.broadcast(`Minigame settings not found for <code>${minigame}</> at round_end_update`);}
  }

  async stats_and_elo_adjust(minigame: string) // Maths and applies elo changes to players at round end (NEEDS TESTING)
  {
    if (this.is_minigame_not_pvp(minigame)) return;
    if (this.debug) this.omegga.broadcast("stats_and_elo_adjust() ran");

    let players = await this.omegga.getAllPlayerPositions();
    let mini = this.minigame_settings.find(m => m.name === minigame);
    if (!mini) {this.omegga.broadcast(`Minigame not found for <code>${minigame}</> at stats_and_elo_adjust`); return;}
    if (!mini.tracking) return;

    let store_objs:GlobalStats[] = [];
    let total_elos: TeamStats[] = []; // some variables for each team
    let mini_full_stats: ILogMinigame = await this.get_minigames_filter(mini.name);
    let alive_team: number = 0;
    // set up objects for every team
    for (let t of mini_full_stats.teams) 
    {
      if (t.name === "[Unassigned]") continue;
      let team_elo: TeamStats = {team: t.name, elo: 0, winrate: 0, alive: false, players: []};
      team_elo.team = t.name;
      for (let p of t.members)
      {
        let player = players.find(pp => pp.player.name === p.name); // get player from getallplayerpositions that is currently used in team.members
        if (!player) {this.omegga.broadcast(`Player ${p.name} not found for some reason at stats_and_elo_adjust()`); continue;}
        
        let store_obj: GlobalStats = await this.store.get<any>(`Player-${p.name}`);
        if (!store_obj) {this.omegga.broadcast(`Stats not found for ${p.name} at stats_and_elo_adjust()`); continue;};
        store_objs.push(store_obj);

        team_elo.players.push(p.name);
        team_elo.elo += store_obj.data.elo;
        team_elo.winrate += store_obj.data.winrate;
        if (!player.isDead) 
        {
          alive_team++;
          team_elo.alive = true;
        }
      }
      team_elo.elo /= team_elo.players.length;
      team_elo.winrate /= team_elo.players.length;
      total_elos.push(team_elo);
    }
    if (alive_team == 0) {this.print_to_mini(mini.name, `No team alive!`, 12, 'f99'); return;}
    else if (alive_team > 1) {this.print_to_mini(mini.name, `Multiple teams alive!`, 12, 'f99'); return;}

    // seperate / combine for winning and other teams
    let winner_team: {elo: number, winrate: number,} = {elo: 0, winrate: 0};
    let other_teams: {elo: number, winrate: number,} = {elo: 0, winrate: 0};
    for (let t in total_elos) 
    {
      if (total_elos[t].alive === true) // add elo to correct variable for if alive
      {
        winner_team.elo += total_elos[t].elo;
        winner_team.winrate += total_elos[t].winrate;
      }
      else {
        other_teams.elo += total_elos[t].elo;
        other_teams.winrate += total_elos[t].winrate;
      }
    }
    other_teams.elo /= total_elos.length - 1; // average out other teams combined elos and winrates
    other_teams.winrate /= total_elos.length - 1;

    // math out elo trade
    let winrate_ratio: number = 1 / (1 + 5 ** (other_teams.winrate - winner_team.winrate));
    let elo_ratio: number = 1 / (1 + 1.4 ** (other_teams.elo - winner_team.elo));
    let winning_team_ratio = Math.max(Math.min((winrate_ratio + elo_ratio) / 2, 0.9), 0.1);

    const k_factor: number = elo_range / 50;
    let traded_elo =  Math.round((k_factor * (1 - (winning_team_ratio))) * 1000)  / 1000;
    //stat update
    for (let t of total_elos) 
    {
      for (let p of t.players) 
      {
        let store_obj:GlobalStats = store_objs.find(s => s.name === p);
        if (!store_obj) {this.omegga.broadcast(`Global stats not found for ${p} in stats_and_elo_adjust()`); continue;}
        let mini_obj = store_obj.minidata.find(m => m.mininame === mini.name); // get players mini stats
        if (!mini_obj) {this.omegga.broadcast(`Minigame stats not found for ${p} in stats_and_elo_adjust()`); continue;}

        let elo_trade: number;
        if (t.alive === true) 
        {
          elo_trade = traded_elo;
          store_obj.data2.wins += 1;
          mini_obj.ministats.data2.wins += 1;
          store_obj.data3.cash += 4;
          this.font_print(`+${traded_elo} elo, +1 win, +4 cash`, p, 12, "9f9");
        } else 
        {
          elo_trade = -traded_elo;
          store_obj.data2.losses += 1;
          mini_obj.ministats.data2.losses += 1;
          this.font_print(`-${traded_elo} elo, +1 loss`, p, 12, "f99");
        }

        store_obj.data.elo += elo_trade;
        mini_obj.ministats.data.elo += elo_trade;

        if (store_obj.data2.losses === 0) store_obj.data.winrate = 1;
        else store_obj.data.winrate = store_obj.data2.wins / (store_obj.data2.wins + store_obj.data2.losses);
        
        if (mini_obj.ministats.data2.losses === 0) mini_obj.ministats.data.winrate = 1;
        else mini_obj.ministats.data.winrate = mini_obj.ministats.data2.wins / (mini_obj.ministats.data2.losses + mini_obj.ministats.data2.wins);
        
        this.store.set<any>(`Player-${p}`, store_obj);
      }
    }
  };

  async handle_players_loadouts(minigame: string) 
  {
    if (this.is_minigame_not_pvp(minigame)) return;
    if (this.debug) this.omegga.broadcast("handle_player_loadouts() ran");

    let mini_obj = this.minigame_settings.find(m => m.name === minigame);
    if (!mini_obj) {this.omegga.broadcast(`Minigame not found in handle_player_loadouts()`); return;}
    let poss: {name: string, pos:number[]}[] = [];
    let plrs = await this.omegga.getAllPlayerPositions();
    
    for (let t of mini_obj.teams) for (let p of t.players) 
    {
      let brs = save;
      brs.brick_owners = [{name:`Elo${mini_obj.owner_identifier}`, id:`ffffffff-ffff-ffff-ffff-b71f3828d${mini_obj.owner_identifier}`, bricks: 0}]
      let plr = plrs.find(pl => pl.player.name === p.name);
      if (!plr) {this.omegga.broadcast(`Couldn't find ${p.name} in handle_players_loadouts()`); continue;}
      poss.push({name: plr.player.name, pos:plr.pos});

      let store_obj:GlobalStats = await this.store.get<any>(`Player-${p.name}`);
      if (!store_obj) {this.omegga.broadcast(`Couldn't find Global stats for ${p.name} in handle_players_loadouts()`); continue;}
      
      // setup brs to have players weapons
      if (store_obj.loadout.primary !== 0) 
      {
        brs.bricks[0].components.BCD_ItemSpawn.PickupClass = primaries[store_obj.loadout.primary].weapon;
        brs.bricks[0].components.BCD_ItemSpawn.PickupScale = primaries[store_obj.loadout.primary].scale;
        brs.bricks[0].position[2] = 50;
      } else brs.bricks[0].position[2] = -10000;
      if (store_obj.loadout.secondary !== 0) 
      {
        brs.bricks[1].components.BCD_ItemSpawn.PickupClass = secondaries[store_obj.loadout.secondary].weapon;
        brs.bricks[1].components.BCD_ItemSpawn.PickupScale = secondaries[store_obj.loadout.secondary].scale;
        brs.bricks[1].position[2] = 25;
      } else brs.bricks[1].position[2] = -10000;
      if (store_obj.loadout.tertiary !== 0) 
      {
        brs.bricks[2].components.BCD_ItemSpawn.PickupClass = tertiaries[store_obj.loadout.tertiary].weapon;
        brs.bricks[2].components.BCD_ItemSpawn.PickupScale = tertiaries[store_obj.loadout.tertiary].scale;
        brs.bricks[2].position[2] = 0;
      } else brs.bricks[2].position[2] = -10000;

      // load brs under player
      await this.omegga.loadSaveData(brs, {offX: plr.pos[0], offY: plr.pos[1], offZ: plr.pos[2] - 200, quiet: true});
    }
    // teleport players after setting up everything for a quicker consistent start
    for (let p of poss) 
    {
      this.omegga.writeln(`Chat.Command /tp "${p.name}" ${p.pos[0]} ${p.pos[1]} ${p.pos[2] - 60} 0`);
    }
    setTimeout(() => {
      this.omegga.clearBricks({id: `ffffffff-ffff-ffff-ffff-b71f3828d${mini_obj.owner_identifier}`}, true); // remove 'Elo' bricks
    }, 1000);
  }

  async update_minigame(minigame: string) // updates a specific minigame, for joining/leaving
  {
    if (this.is_minigame_not_pvp(minigame)) return;
    if (this.debug) this.omegga.broadcast("update_minigame() ran");

    let mini: ILogMinigame = await this.get_minigames_filter(minigame);
    let setting_mini: MiniSetting = { name: "", owner_identifier: "000", matchmaked: false, ranked: false, tracking: false, plr_threshold: 0, teams: [] };
    for (let m in this.minigame_settings) 
    {
      if (this.minigame_settings[m].name === minigame) setting_mini = this.minigame_settings[m];
    }

    if (mini && setting_mini) 
    {
      let reg_match:RegExpMatchArray = /(\d+)[vV](\d+)/.exec(mini.name);
      if (reg_match && reg_match.length > 1)
      {
        let team = mini.teams.filter(t => t.name !== "[Unassigned]");
        let teams = [];
        for (let t of team) teams.push({team: t.team, players: t.members});

        setting_mini.teams = teams;
        setting_mini.plr_threshold = Number(reg_match[1]) + Number(reg_match[2]);
        setting_mini.name = mini.name;
        setting_mini.ranked = mini.name.toLowerCase().includes(" ranked");
        setting_mini.matchmaked = mini.name.toLowerCase().includes("matchmak");
      } else 
      {
        this.omegga.broadcast(`Minigame <code>${mini.name}</> failed regex, title may be missing player count ex. (1v1, 3V3)`);
        return;
      }
    } else {this.omegga.broadcast(`Minigame or Minigame settings not found for <code>${minigame}</> at update_minigame`);}
  }

  async update_minigames() // updates all minigames and resets minigame_settings, also
  {
    if (this.debug) this.omegga.broadcast("update_minigames() ran");

    let minis = (await this.omegga.getMinigames())
      .filter(m => m.name !== "GLOBAL") // remove global
      .filter(m => !m.name.toLowerCase().includes("spec")); // remove spectate

    this.minigame_settings = [];
    let identifier_tick: number = 0;
    for (let m of minis) 
    {
      identifier_tick++;
      let setting_mini:MiniSetting = { name: "", owner_identifier: "000", matchmaked: false, ranked: false, tracking: false, plr_threshold: 0, teams: [] };

      let player_number: number = 0;
      const match = m.name.match(/\d+[Vv]\d+[\dVv]*/);
      if (!match) this.omegga.broadcast(`Couldn't find player amount in ${m.name}`);
      else 
      {
        let nums: number[] = match[0].split(/[Vv]/).map(n => Number(n));
        nums.some(n => 
        {
          if (!isNaN(n)) player_number += n;
        })
        if (player_number === 0) 
        {
          this.omegga.broadcast(`Minigame <code>${m.name}</> failed regex, title may be missing player count ex. (1v1, 3V3)`);
          return;
        }

        setting_mini.name = m.name;
        let owner_string: string = "0".repeat(3 - identifier_tick.toString().length)
        owner_string += identifier_tick.toString();
        setting_mini.owner_identifier = owner_string;
        setting_mini.matchmaked = m.name.toLowerCase().includes("matchmak"); // matchmaking, matchmake
        setting_mini.ranked = m.name.toLowerCase().includes(" ranked"); // finds minigames like "2v2 ranked" but not "2v2 unranked"
        setting_mini.plr_threshold = player_number;

        let team = m.teams.filter(t => t.name !== "[Unassigned]");
        for (let t of team) setting_mini.teams.push({team: t.team, players: t.members});

        if (this.debug) this.omegga.broadcast("updated minigame settings");
        this.minigame_settings.push(setting_mini);
      }
    }
    this.omegga.broadcast('Successfully updated minigames and spawnpoints!');
  };

  async stats_modify(player:string, kills:number, add:boolean, type: string)
  {
    let plr_obj:GlobalStats = await this.store.get<any>(`Player-${player}`) || undefined;
    if (!plr_obj) {this.omegga.broadcast(`Couldn't find data for ${player}`); return;}

    if (add) 
    {
      plr_obj.data2.kills += kills;
      let xp = 1 * kills, cash = 2 * kills;
      plr_obj.data3.xp += xp;
      plr_obj.data3.cash += cash;
      this.font_print(`+${xp} xp, +${cash} cash`, player, 12, "9f9");
      await this.store.set<any>(`Player-${player}`, plr_obj);
    } else 
    {
      let xp = 3 * kills;
      plr_obj.data3.xp -= xp;
      this.font_print(`-${xp} xp for ${type}`, player, 12, "f99");
      await this.store.set<any>(`Player-${player}`, plr_obj);
    }
  }

  async add_mini_to_stats(player_name: string, minigame: string) 
  {
    if (this.is_minigame_not_pvp(minigame)) return;
    if (this.debug) this.omegga.broadcast("add_mini_to_stats() ran");
    let store_obj: GlobalStats = await this.store.get<any>(`Player-${player_name}`)

    if (!store_obj) {this.omegga.broadcast(`Couldn't find data for ${player_name}`); return;}
    if (store_obj.minidata.find(m => m.mininame === minigame)) return;
    
    let minigame_obj = {mininame: minigame, ministats: {data:{elo: 0, winrate: 1}, data2: {wins: 0, losses: 0}}};
    store_obj.minidata.push(minigame_obj);
    await this.store.set<any>(`Player-${player_name}`, store_obj);
    this.omegga.whisper(player_name,`Added <code>${minigame}</> to your minigame stats`);
  }

  killed_last: string[] = [];
  death_last: string[] = [];
  async kill_death() // find out how the confrontation ended
  {
    if (this.death_last.length)
    {
      if (this.killed_last.length)
      {
        let k = this.death_last.length; // kills
        let tk = 0; // teamkills
        let killer_team = this.get_team(this.killed_last[0]);

        for (let p of this.death_last)
        {
          if (this.get_team(p) === killer_team) 
          {
            k--;
            tk++;
          }
        }

        let mini: string = "";
        if (this.print_kills) mini = this.get_mini(this.killed_last[0]);

        if (this.killed_last.length > 1 && this.death_last.find(p => p === this.killed_last[0]) !== undefined) 
        { // means two killed at once and are both in each array
          // no stats_modify, trade
          if (this.print_kills) this.print_to_mini(mini, `${this.death_last.join(" + ")} <color="ff1">Traded</> kills!`, 15, "ccc");
          this.clear_death();
          return;
        } else if (this.killed_last.length === 1 && this.death_last.find(p => p === this.killed_last[0])) // suicide (penalize)  if only 1 killer that in death_last too
        { 
          await this.stats_modify(this.killed_last[0], tk, false, this.kill_string("suicide", tk));
          if (this.print_kills) 
          {
            let tks: string = "";
            if (tk > 1) tks = " + teamkilled"
            if (this.print_kills) this.print_to_mini(mini, `${this.killed_last[0]} <color="f33">suicided${tks}</>!`, 15, "ccc");
          }
          this.clear_death();
          return;
        } else 
        { 
          if (tk) // account for tk's, then account of kills 
          {
            await this.stats_modify(this.killed_last[0], tk, false, this.kill_string("teamkill", this.death_last.length));
            if (this.print_kills) this.print_to_mini(mini, `${this.killed_last[0]} <color="f22">teamkilled</> ${this.death_last.join(" + ")}!`, 15, "ccc");
          } else if (k)
          {
            await this.stats_modify(this.killed_last[0], k, true, this.kill_string("kill", this.death_last.length));  
            if (this.print_kills) this.print_to_mini(mini, `${this.killed_last[0]} <color="5f5">killed</> ${this.death_last.join(" + ")}!`, 15, "ccc");
          }
          this.clear_death();
          return;
        }
      } // if non suicide death (ignore)
      this.clear_death();
      return;
    }
  }

  clear_death()
  {
    this.killed_last = [];
    this.death_last = [];
  }
  kill_string(msg: string, dead_count: number) 
  {
    if (msg === "suicide") 
    {
      if (dead_count > 2) return `${msg} + ${dead_count - 1} teamkills`
      else if (dead_count > 1) return `${msg} + teamkill`
      else return `${msg}`
    } else 
    {
      if (dead_count > 1) return `${dead_count} ${msg}s`
      else return `${msg}`
    }
  }

  async pluginEvent(event: string, from: string, ...args: any[]) {
    const [{ name, player, minigame, leaderboard }] = args; //name = mini's name, player = OmeggaPlayer, minigame = ILogMinigame, leaderboard = idk
    switch(event) 
    {
      case 'roundend': // name
        await this.stats_and_elo_adjust(name);
        break;
      case 'roundchange': // name
        await this.update_minigame(name);
        await this.round_end_update(name);
        this.clear_death();
        await this.handle_players_loadouts(name);
        break;
      case 'joinminigame': // player, minigame
        if (player && minigame) { // JUST UPDATE PLAYER DATA IF IT DOESNT HAVE, NEW ROUND WILL HANDLE TEAMS
          await this.add_mini_to_stats(player.name, minigame.name);
        }
        break;
      case 'leaveminigame': // player, minigame
        if (player && minigame) {
          
        }
        break;
      case 'leaderboardchange': // player, leaderboard
        break;
      case 'score': // player, leaderboard
        break;
      case 'kill': // player, leaderboard
        if (player) {
          this.killed_last.push(player.name);
          setTimeout(() => {this.kill_death();}, 2) //2 ms buffer to collect events
        }
        break;
      case 'death': // player, leaderboard
        if (player) {
          this.death_last.push(player.name);
        }
        break;
    }
  }

  get_team(person: string) 
  {
    for (let m of this.minigame_settings) for (let t of m.teams) for (let p of t.players)
    {
      if (p.name === person) return t.team;
    }
  }
  get_mini(person: string) 
  {
    for (let m of this.minigame_settings) for (let t of m.teams) for (let p of t.players)
    {
      if (p.name === person) return m.name;
    }
  }
  async get_minigames_filter(minigame: string) 
  {
    let minis = (await this.omegga.getMinigames()).find(m => m.name === minigame);
    return minis;
  }
  is_minigame_not_pvp(minigame: string) 
  {
    for (let m of blacklist_minis) if (minigame.toLowerCase().includes(m)) return true;
    return false;
  }

  print_to_mini(minigame: string, msg: string, size?: number, color?: string) 
  {
    let mini = this.minigame_settings.find(m => m.name === minigame);
    if (mini) 
    {
      let player_names: string[] = [];
      for (let t of mini.teams) for (let p of t.players) player_names.push(p.name);
      for (let p of player_names) this.font_print(msg, p, size, color);
    }
  }

  font_print(message: string, speaker_to_whisper?:string, size?: number, color?: string, code?: boolean) 
  {
    if (color) message = OMEGGA_UTIL.chat.color(message, color);
    if (size) message = OMEGGA_UTIL.chat.size(message, size);
    if (code) message = OMEGGA_UTIL.chat.code(message);
    if (speaker_to_whisper) this.omegga.whisper(speaker_to_whisper, message);
    else this.omegga.broadcast(message);
  }

  async setup_stats(player: string, command: boolean) 
  {
    let store_obj: GlobalStats;
    if (!command) store_obj = await this.store.get<any>(`Player-${player}`) || undefined;
    else store_obj = await this.store.get<any>(`Player-${command}`) || undefined;
    if (!store_obj)
    {
      let new_obj:GlobalStats = {
        data:{elo: elo_range / 2, winrate: 1},
        data2:{kills: 0, wins: 0, losses: 0},
        data3:{cash: 0, level: 0, xp: 0,},
        minidata:[],
        loadout:{primary: 1, secondary: 1, tertiary: 0},
        name: player
      };
      await this.store.set<any>(`Player-${player}`, new_obj);
      this.omegga.broadcast(`<size="12"> Init'd global data for ${player}</>`);
      return;
    }
  }

  async edit_stats(player: string, all: boolean) 
  {

  }

  async loadout_change(speaker: string, slot: string, option: string) 
  {
    if (!slot || Number(slot) > 3) 
    {
      this.font_print("Write a number after command to see list for weapon type", speaker, 16, '9f9');
      this.font_print("1 = Primary,  2 = Secondary,  3 = Tertiary,  view = see current weapons", speaker, 14, '9f9');
      this.font_print("ex. <code>/l 2</> or <code>/l view</>", speaker, 14, '9f9');
      this.font_print("ex. <code>/l 1 2</> will select weapon 2 in slot 1", speaker, 14, '9f9');
      return;
    }

    let weapon_type: Weapon[] = [], weapon_type_plural: string = "", weapon_type_name: string = "";
    switch (slot) 
    {
      case "1":
        weapon_type = primaries;
        weapon_type_plural = "Primaries";
        weapon_type_name = "Primary";
        break;
      case "2":
        weapon_type = secondaries;
        weapon_type_plural = "Secondaries";
        weapon_type_name = "Secondary";
        break;
      case "3":
        weapon_type = tertiaries;
        weapon_type_plural = "Tertiaries";
        weapon_type_name = "Tertiary";
        break;
      case "view":
        let store_obj: GlobalStats = await this.store.get<any>(`Player-${speaker}`);
        if (!store_obj) {this.omegga.whisper(speaker, "Store object not found."); return;}
        this.font_print(`Primary: ${primaries[store_obj.loadout.primary].name} ${primaries[store_obj.loadout.primary].scale}x`, speaker, 17);
        this.font_print(`Secondary: ${secondaries[store_obj.loadout.secondary].name} ${secondaries[store_obj.loadout.secondary].scale}x`, speaker, 17);
        this.font_print(`Tertiary: ${tertiaries[store_obj.loadout.tertiary].name} ${tertiaries[store_obj.loadout.tertiary].scale}x`, speaker, 17);
        return;
      default:
        return;
    }

    if (!option) 
    {
      this.font_print(`List of ${weapon_type_plural}`, speaker, 18, 'fff');
      let data: string = "";
      for (let i = 0; i < weapon_type.length; i++) 
      {
        data = data + `| <color="9f9">${i}</> - ${weapon_type[i].name}-${weapon_type[i].scale}x `;
        if (i % 4 == 3 || weapon_type.length - i < 2) 
        {
          if (i > 0) 
          {
            this.font_print(data, speaker, 14, 'fff');
            data = "";
          }
        }
      }
    } else 
    {
      if (isNaN(Number(option))) {this.font_print(`Invalid weapon number`, speaker, 16, "f99"); return;}
      let store_obj: GlobalStats = await this.store.get<any>(`Player-${speaker}`);
      if (!store_obj) {this.omegga.whisper(speaker, "Store object not found."); return;}
      if (Number(option) && Number(option) >= weapon_type.length) {this.font_print(`${weapon_type_plural} Does not have ${option} weapons.`, speaker, 16, 'f99'); return;}

      if (slot === "1") store_obj.loadout.primary = Number(option);
      else if (slot === "2") store_obj.loadout.secondary = Number(option);
      else if (slot === "3") store_obj.loadout.tertiary = Number(option);
          
      this.font_print(`Set ${weapon_type_name} weapon to ${weapon_type[option].name}`, speaker, 16, '9f9');
      this.store.set<any>(`Player-${speaker}`, store_obj);
    }
  }

  commands_help(speaker: string, number: number) 
  {
    console.log(number)
    if (!number) number = 1;
    if (number > 2) {this.font_print(`Nothing at ${number}`, speaker, 16, "9f9"); return;}
    switch (String(number)) 
    {
      case "2": 
        this.font_print(`<u>Commands page 2</>`, speaker, 16, 'fa5');
        this.font_print(`<code>/top</> views top players. You can search specific stats`, speaker, 15, '9f9');
        this.font_print(`<code>/minitop</> views top players for minigame your in. You can search specific stats`, speaker, 15, '9f9');
        break;
        case "3": 
        this.font_print(`<u>Commands page 2</>`, speaker, 16, 'fa5');
        this.font_print(`<code>/top</> views top players. You can search specific stats`, speaker, 15, '9f9');
        this.font_print(`<code>/minitop</> views top players for minigame your in. You can search specific stats`, speaker, 15, '9f9');
        break;
      default:
        this.font_print(`<u>Commands page 1</>`, speaker, 16, 'fa5');
        this.font_print(`<code>/L</> is the loadout command, try it out!`, speaker, 15, '9f9');
        this.font_print(`<code>/stats</> views your stats. You can search others names too`, speaker, 15, '9f9');
        this.font_print(`<code>/ministats</> views your stats for minigame your in. You can search others names too`, speaker, 15, '9f9');
        this.font_print(`/commands 2  to view more`, speaker, 12, 'bbb');
        break;
    }
  }

  async stop() 
  {
    const minigameEvents = await this.omegga.getPlugin('minigameevents');
    if (minigameEvents) {
      console.log('unsubscribing from minigameevents');
      minigameEvents.emitPlugin('unsubscribe', []);
    } else throw Error("minigameevents plugin is required for this to plugin");
  }
}