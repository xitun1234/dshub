import { fetchLotteryRSS } from "./src/lib/rss";

const ALIAS_MAP: Record<string, string> = {
  'tphcm': 'TP.HCM', 'hcm': 'TP.HCM', 'tp': 'TP.HCM',
  'la': 'Long An', 'longan': 'Long An'
};

const normalizeStation = (s: string) => s.toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");

async function run() {
  const rssData = await fetchLotteryRSS('MN', 6);
  const orderedStations = Object.keys(rssData.results);
  
  console.log("Ordered Stations (from RSS):", orderedStations);
  
  const aliases = ["tp", "la"];
  const actualStations: string[] = [];
              
  aliases.forEach(alias => {
     const officialName = ALIAS_MAP[alias] || alias;
     const normOfficial = normalizeStation(officialName);
     const normAlias = normalizeStation(alias);
     
     console.log(`Matching alias: ${alias} (official: ${officialName}, normOfficial: ${normOfficial}, normAlias: ${normAlias})`);
     
     const found = orderedStations.find(st => {
        const normSt = normalizeStation(st);
        const isMatch = normSt.includes(normOfficial) || normOfficial.includes(normSt) || normSt.includes(normAlias);
        console.log(`  against ${st} (normSt: ${normSt}): ${isMatch}`);
        return isMatch;
     });
     
     if (found && !actualStations.includes(found)) {
        actualStations.push(found);
     }
  });
  
  console.log("Final matched stations to check:", actualStations);
}

run().catch(console.error);
