import xmlParser from 'xml2json';
const R2FE_URL = "https://www.resultats-elections.interieur.gouv.fr/telechargements/LG2024/resultatsT2/R2FE.xml";
const countRaw = await fetch(R2FE_URL).then((x) => x.text());
const countJson = JSON.parse(xmlParser.toJson(countRaw));
const nuances = {}, nuancesNames = {};
for (let nuance of countJson.Election.EnsembleGeo.Tours.Tour[0].Resultats.NuancesCandidats.NuanceCandidat) {
    nuances[nuance.CodNuaCand] = parseInt(nuance.NbSieges);
    nuancesNames[nuance.CodNuaCand] = nuance.LibNuaCand;
}
for (let nuance of countJson.Election.EnsembleGeo.Tours.Tour[1].Resultats.NuancesCandidats.NuanceCandidat) {
    nuances[nuance.CodNuaCand] = nuances[nuance.CodNuaCand] + parseInt(nuance.NbSieges);
    nuancesNames[nuance.CodNuaCand] = nuance.LibNuaCand;
}
console.log("===== Résultats bruts =====");
for (let key in nuances) console.log(nuancesNames[key], key, nuances[key]);
console.log("===== Comptabilisation des alliances =====");
let alliances = [["Rassemblement national et allié.es", "RN", "UXD"], ["Ensemble ! (alliance présidentielle)", "ENS", "HOR", "UDI"], ["Nouveau Front populaire", "UG"], ["Divers Gauche", "DVG", "ECO", "SOC", "FI"], ["Divers Droite", "DVD", "LR", "REG"], ["Autres", "DVC", "EXD", "DIV"]];
let alliancesData = {};
for (let alliance of alliances) {
    let name = alliance[0];
    let allies = alliance.slice(1);
    let total = allies.map(x => nuances[x]).reduce((p, c) => p + c, 0);
    alliancesData[name] = total;
}
alliancesData["Total"] = Object.values(alliancesData).reduce((p, c) => p + c, 0);
console.log(alliancesData);
console.log("===== Comptabilisation des bords =====");
let bords = [
    ["Extrême gauche", "EXG"],
    ["Gauche", "COM", "FI", "SOC", "RDG", "VEC", "DVG", "UG"],
    ["Divers", "REG", "DIV", "ECO"],
    ["Centre", "HOR", "ENS", "DVC"],
    ["Droite", "UDI", "LR", "DVD"],
    ["Extrême droite", "DSV", "RN", "REC", "UXD", "EXD"],

];
let bordsData = {};
for (let bord of bords) {
    let name = bord[0];
    let allies = bord.slice(1);
    let total = allies.map(x => nuances[x]).reduce((p, c) => p + c, 0);
    bordsData[name] = total;
}
bordsData["Total"] = Object.values(bordsData).reduce((p, c) => p + c, 0);
console.log(bordsData);