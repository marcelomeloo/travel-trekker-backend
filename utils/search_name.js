import { airports } from '../assets/airports.js';

const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
              dp[i - 1][j] + 1,
              dp[i][j - 1] + 1,
              dp[i - 1][j - 1] + cost
          );
      }
  }

  return dp[m][n];
};

export const searchAirportsFuzzy = (query) => {
  const results = [];
  const queryLower = query.toLowerCase();

  for (const airport of airports) {
      if (
        //   airport.name.toLowerCase().includes(queryLower) ||
          airport.iata_code.toLowerCase() === queryLower ||
          airport.municipality.toLowerCase() === queryLower ||
          levenshteinDistance(airport.name.toLowerCase(), queryLower) <= 3
      ) {
          results.push(airport);
      }
  }

  return results;
};

// Example usage
// const query = 'nvt';
// const results = searchAirportsFuzzy(query);

// console.log('Search Results:');
// console.log(results);
