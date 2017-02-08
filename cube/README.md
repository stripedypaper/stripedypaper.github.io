# [Cube Sim by stripedypaper](https://stripedypaper.github.io/cube/)

## Changelog

1.00 : complete red cube functionality  
1.01 : complete black and bonus cube functionality  
1.02 : equip swapping  
1.03 : cube counter  
1.04 : removed avoidability and magic defense lines to match GMS
1.05 : changed min and max crit to just crit damage to match GMS

## Disclaimer

Maplestory and all related content including images and sounds used are sole property of Nexon. This site is not affiliated with or sponsored by Nexon/Maplestory.

## Implementation Details

All info on potential lines, which potentials can appear on which types of equipment, and potential weights (likelihood) for bonus potential are read directly from the game file Item.wz/ItemOption.img. The file P.js is the result of XML to JSON conversion of that file, after manually removing entries for things like Soul item potential.

The following assumptions were made (some based on stats I've seen around reddit):

- Red Cube tier up chance: 10% rare to epic, 5% epic to unique, 2.5% unique to legendary
- Black Cube tier up chance: 20% rare to epic, 10% epic to unique, 5% unique to legendary
- Bonus Cube tier up chance: 20% rare to epic, 10% epic to unique, 5% unique to legendary
- Line tier up chance: 100% first line, 15% second line, 5% third line*
- Potential options for regular non-bonus potential are all equally likely

*For example, on a legendary armor a str% line is always 12% if it is the first line. The second and third lines start at 9% str but have a 15% and 5% chance respectively to become a 12% str line. These percentages were based on me watching people cube on youtube and counting it up (~300 sample size, not huge).
