import xmlParser from 'xml2json';

/** Count status **/
// get data
const COUNT_STATUS_URL = 'https://www.resultats-elections.interieur.gouv.fr/telechargements/LG2024/resultatsT2/INDEX2FE.xml';
const countRaw = await fetch(COUNT_STATUS_URL).then((x) => x.text());
const countJson = JSON.parse(xmlParser.toJson(countRaw));
// total counted
let totalCounted = 0;
for (let dept of countJson.Election.EnsembleGeo.Departements.Departement) {
	totalCounted += (dept.PourcentageBureauxDeVoteSaisis == "100,00" ? 1 : 0);
}
console.log('Dépouillage', ((totalCounted / countJson.Election.EnsembleGeo.Departements.Departement.length) * 100).toFixed(2), '%');
/****/

/** Departments **/
// calculate depts
let depts = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', 
    '2A', '2B', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', 
    '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', 
    '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', 
    '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', 
    '95', '971', '972', '973', '974', '975', '976', '987', '988', '2A', '2B', 'ZX', 'ZZ'
];
// get data by dept
const deptsRaws = await Promise.all(depts.map((x) => fetch(`https://www.resultats-elections.interieur.gouv.fr/telechargements/LG2024/resultatsT2/${x}/R2${x}CIR.xml`).then((r) => r.text())));
const deptsParsed = deptsRaws.map((x) => JSON.parse(xmlParser.toJson(x)));
// parse elus
let elus = [];
let totalCircos = 0;
for (let dept of deptsParsed) {
    // get circos
    let circos = (Array.isArray(dept.Election.Departement.Circonscriptions.Circonscription) ? dept.Election.Departement.Circonscriptions.Circonscription : [dept.Election.Departement.Circonscriptions.Circonscription]);
    totalCircos += circos.length;
    // for each circo
    for (let circo of circos) {
        // seats available
        if (circo.NbSiePourvus !== circo.NbSap) {
            console.log(circo.CodCirElec, dept.Election.Departement.LibDpt, circo.LibCirElec, "-", "Sièges à pouvoir.");
            continue;
        }
        // élu disponible
        let tour = (!Array.isArray(circo.Tours.Tour) ? circo.Tours.Tour : circo.Tours.Tour.find(x => x.NumTour == "2"));
        if (!Array.isArray(tour.Resultats.Candidats.Candidat)) {
            console.log(circo.CodCirElec, dept.Election.Departement.LibDpt, circo.LibCirElec, "-", "Élu T" + tour.NumTour + " (mono)");
            elus.push(tour.Resultats.Candidats.Candidat);
            continue;
        }
        console.log(circo.CodCirElec, dept.Election.Departement.LibDpt, circo.LibCirElec, "-", "Élu T" + tour.NumTour);
        let parseNbVoix = tour.Resultats.Candidats.Candidat.map(x => {
            x.NbVoix = parseInt(x.NbVoix);
            return x;
        }).sort((a, b) => b.NbVoix - a.NbVoix);
        elus.push(parseNbVoix[0]);
    }
}
// show results
console.log("===== Résultats bruts =====");
console.log(totalCircos, "circos");
console.log(elus.length, "élu.es sur", 577, "sièges");
let nuances = {}, nuancesMap = {};
for (let elu of elus) {
    nuances[elu.CodNuaCand] = (nuances[elu.CodNuaCand] ? nuances[elu.CodNuaCand] + 1 : 1);
    nuancesMap[elu.CodNuaCand] = elu.LibNuaCand;
}
for (let key in nuances) console.log(nuancesMap[key], key, nuances[key]);
console.log("===== Comptabilisation des alliances =====");
let alliances = [["Rassemblement national et allié.es", "RN", "UXD"], ["Ensemble ! (alliance présidentielle)", "ENS", "HOR", "UDI"], ["Nouveau Front populaire", "UG"], ["Divers Gauche", "DVG", "ECO", "SOC"], ["Divers Droite", "DVD", "LR", "REG"], ["Autres", "DVC", "EXD", "DIV"]];
let alliancesData = {};
for (let alliance of alliances) {
    let name = alliance[0];
    let allies = alliance.slice(1);
    let total = allies.map(x => nuances[x]).reduce((p, c) => p + c, 0);
    alliancesData[name] = total;
}
alliancesData["Total"] = Object.values(alliancesData).reduce((p, c) => p + c, 0);
console.log(alliancesData);