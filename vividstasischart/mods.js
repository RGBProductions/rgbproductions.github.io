let gimmicks = {};
let globalMods = {};
let modWeight = {};
let globalModIndex = 0;

function addGlobalMod(name, weight) {
    let i = globalModIndex;
    if (i >= 128) return;
    globalModIndex++;

    globalMods[name] = i;
    modWeight[name] = weight;
}

function addGimmick(name, extraMods) {
    let gimmick = {extraMods: {}};
    let index = 0;
    for (let mod of extraMods) {
        gimmick.extraMods[mod[0]] = index | 128;
        modWeight[mod[0]] = mod[1] ?? 1;
        index++;
    }
    gimmicks[name] = gimmick;
}

addGlobalMod("unknown", 0);
addGlobalMod("prx", 2);
addGlobalMod("prxb", 2);
addGlobalMod("prxc", 2);
addGlobalMod("pry", 2);
addGlobalMod("pryb", 2);
addGlobalMod("pryc", 2);
addGlobalMod("prsx", 2);
addGlobalMod("pra", 2);
addGlobalMod("przm", 2);
addGlobalMod("przmb", 2);
addGlobalMod("przx", 2);
addGlobalMod("przy", 2);
addGlobalMod("prrx", 2);
addGlobalMod("prry", 2);
addGlobalMod("prrz", 2);
addGlobalMod("prrzb", 2);
addGlobalMod("shxs", 1.5);
addGlobalMod("shxp", 1.5);
addGlobalMod("shxa", 1.5);
addGlobalMod("shys", 1.5);
addGlobalMod("shyp", 1.5);
addGlobalMod("shya", 1.5);
addGlobalMod("scrollspeed", 0);
addGlobalMod("noterot", 2.5);
addGlobalMod("velocity", 2);
addGlobalMod("spinradius", 2);
addGlobalMod("spiny", 2);
addGlobalMod("spinx", 2);
addGlobalMod("driven", 4);
addGlobalMod("beat", 1.5);
addGlobalMod("wave", 2.5);
addGlobalMod("hom", 2);
addGlobalMod("boost_distance", 2.5);
addGlobalMod("boost_time", 2.5);
addGlobalMod("yoffset", 1.5);
addGlobalMod("notealp", 1.5);
addGlobalMod("przmc", 1);
addGlobalMod("prxd", 1);
addGlobalMod("pryd", 1);
addGlobalMod("prct", 1);
addGlobalMod("prcb", 1);
addGlobalMod("prcl", 1);
addGlobalMod("prcr", 1);
addGlobalMod("prvib", 1);
addGlobalMod("shct", 1);
addGlobalMod("shft", 1);
addGlobalMod("shcb", 1);
addGlobalMod("shfb", 1);
addGlobalMod("shcl", 1);
addGlobalMod("shfl", 1);
addGlobalMod("shcr", 1);
addGlobalMod("shfr", 1);
addGlobalMod("scrollind0", 1.5);
addGlobalMod("scrollind1", 1.5);
addGlobalMod("scrollind2", 1.5);
addGlobalMod("scrollind3", 1.5);
addGlobalMod("scrollind4", 1.5);
addGlobalMod("scrollind5", 1.5);
addGlobalMod("scrollind6", 1.5);
addGlobalMod("drawdist", 0);
addGlobalMod("pburstleft", 0.5);
addGlobalMod("pburstright", 0.5);
addGlobalMod("particlexpower", 0.5);
addGlobalMod("particleypower", 0.5);
addGlobalMod("uialpha", 0);
addGlobalMod("fx_contrast", 0.5);
addGlobalMod("fx_chroma_distort", 0.5);
addGlobalMod("fx_film", 1);
addGlobalMod("fx_glow", 1);
addGlobalMod("fx_particleglow", 0.5);
addGlobalMod("pburstspeed", 0.5);
addGlobalMod("freeze", 2);
addGlobalMod("drawuntil", 0);

// the horrors
addGimmick("obj___gimmick", [
    ["glitchamp"],["glitchoffset"],["fish"],["vig"],["bloom"],["gray"],
    ["posx"],["posy"],["cover1"],["cover2"],["cover3"],
    ["twx1"],["twy1"],["twa1"],["twr1"],
    ["twx2"],["twy2"],["twa2"],["twr2"],
    ["twx3"],["twy3"],["twa3"],["twr3"],
    ["twx4"],["twy4"],["twa4"],["twr4"],
    ["sina"],["sinp"],["sino"],
    ["cosa"],["cosp"],["coso"],
    ["tana"],["tanp"],["tano"],
    ["static"],["uialpha"],["spinradiusx"],["spinradiusz"],
    ["fakezy"],["fakezyb"],["float"],["wiggly"]
]);
addGimmick("obj_00_gimmick", [["blipzoom"],["blipalpha"],["satal"],["satx"],["saty"]]);
addGimmick("obj_aleph_gimmick", [
    ["glitchamp"],["uialpha"],["scorealph"],["bgalph"],["noteoverlayalp"],["sg_endblip"],
    ["glitchoffset"],["uhnoise"],["abberationxamp"],["abberationyamp"],["fish"],["static"],
    ["sg_endblip_destroy"],["sn_bg_alpha"],["sn_bg_fxamp"],["sn_bg_animspd"],["yoffset"]
]);
addGimmick("obj_distortedfate_gimmick", [
    ["df_sideline"],["df_whitebg"],["df_grid_alpha"],["df_grid_top"],["df_grid_bottom"],
    ["df_sideline2"],["gray"],["barrel"],["barrel2"],["hdistort"],["fish"],["vig"],
    ["abx"],["aby"],["aberamp"],["uialpha"],["cover1"],["cover2"],["cover3"],["wflash"],
    ["rainbow"],["sides"],["notealp"],["video"],["noteoverlayalp"],["df_countdown"],
    ["lr_slash"],["lr_slash_color"],["lr_sides_blue"],["lr_sides_red"],
    ["lr_sides_rev_blue"],["lr_sides_rev_red"],["lr_mountain_bg"]
]);

function getModNameFromByte(b, name) {
    let mods = globalMods;

    if ((b & 128) == 128) {
        let obj = gimmicks[name];
        if (obj) {
            mods = obj.extraMods;
        }
    }

    let mod = Object.keys(mods)[Object.values(mods).indexOf(b)];
    if (mod) {
        console.log(`Found mod ${mod}`);
        return mod;
    }

    console.error(`Unknown mod ${b}`);
}

export {gimmicks, globalMods, modWeight, getModNameFromByte};