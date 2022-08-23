import { cloneDeep, groupBy } from 'lodash';

export function formatJSONForLabels(json: any, type: string = 'regular') {
  try {
    if (json[0]?.labels || json?.labels) {
      // Takes only the labels from the JSON (anything else isn't needed)
      const categories: any = json.length
        ? json?.map((output: any) => {
            return output?.labels;
          })
        : json?.labels;

      // Flatten the labels, then we can group them later by skill
      const flattenLabels = categories.flat();

      // Clones the labels, so we can modify them without affecting the original
      const clonedFlattenLabels = cloneDeep(flattenLabels);

      const clusterLabels = clonedFlattenLabels
        // Filters the labels that are not clusterable (see clusterable lists)
        .filter((label: any) => isClusterable(label.skill))
        .map((label: any) => {
          if (label.skill === 'clustering') {
            if (label?.data?.input_skill) {
              // Adds "Clustering" to the skill name to show clustering
              label.skill = label?.data?.input_skill + ' Clustering';
            } else {
              label.skill = 'clustering';
            }
          }
          return label;
        });

      // Groups labels by skill (LABEL.skill)
      const unitedLabels = groupBy(clusterLabels, 'skill');
      const labels: any = [];

      for (const label in unitedLabels) {
        // Some of the skills use the "value" while others use the "name"
        if (shouldShowValue(label)) {
          labels.push(groupBy(unitedLabels[label], 'value'));
        } else labels.push(groupBy(unitedLabels[label], 'name'));
      }

      const labelsArray: any = [];

      // Loops through grouped labels
      for (const label in labels) {
        // Loops through the labels of each skill
        for (const name in labels[label]) {
          const phrasesArray: any = [];
          const currentLabel = labels[label][name][0];
          for (const subItem in labels[label][name]) {
            if (
              labels[label][name][subItem]?.skill === 'sentiments' ||
              labels[label][name][subItem]?.skill === 'emotions'
            ) {
              // Pushes span_text for sentiments & emotions only (we get that from API)
              phrasesArray.push({
                text: labels[label][name][subItem].span_text,
                items_count: 1,
              });
            } else {
              if (isClusteringLabel(labels[label][name][subItem].skill)) {
                // Loops through items inside "data" to get phrases
                labels[label][name][subItem]?.data?.items?.forEach(
                  (item: any) => {
                    // Loops item.value times through phrases(items)
                    for (let i = 0; i < item.value; i++) {
                      // Pushes the values N times with count 1 to create the same effect
                      phrasesArray.push({
                        text: item.name,
                        items_count: 1,
                      });
                    }
                  }
                );
              } else {
                // Regular skills (no clustering, sentiments or emotions)
                phrasesArray.push({
                  text: labels[label][name][subItem].value,
                  items_count: 1,
                });
              }
            }
          }

          // By default insertedText equals to name
          let insertedText = name;

          if (name === 'POS' && currentLabel?.skill === 'sentiments') {
            // Sentiments POS is not a good name, so we change it to Positive
            insertedText = 'Positive';
          }
          if (name === 'NEG' && currentLabel?.skill === 'sentiments') {
            // Sentiments NEG is not a good name, so we change it to Negative
            insertedText = 'Negative';
          }

          // Pushes the first LEVEL (this is what to be shown in the chart when it gets rendered)
          if (isClusteringLabel(currentLabel?.skill)) {
            labelsArray.push({
              skill: currentLabel?.skill,
              input_skill: currentLabel?.data?.input_skill,
              text: insertedText,
              span_text: insertedText,
              items_count: phrasesArray.length,
              phrases: phrasesArray,
            });
          } else {
            labelsArray.push({
              skill: currentLabel?.skill,
              text: insertedText,
              span_text: insertedText,
              items_count: labels[label][name].length,
              phrases: phrasesArray,
            });
          }
        }
      }

      // Sets the real categories count (we look at the total and not the first level)
      if (type !== 'count') {
        labelsArray.forEach((label: any, index: number) => {
          if (label.phrases) {
            const newItems: any = [];
            const newGroup = groupBy(label.phrases, 'text');
            newGroup &&
              Object.entries(newGroup).forEach(([key, value]) => {
                newItems.push({
                  text: key,
                  //@ts-ignore
                  items_count: value.length,
                });
              });
            labelsArray[index].phrases = newItems;
          }
        });
      }

      return labelsArray;
    } else {
      return cloneDeep(json);
    }
  } catch (e) {
    console.debug('[formatJSONForLabels] error:', e);
    return [];
  }
}

function shouldShowValue(label: string) {
  switch (label) {
    case 'sentiments':
    case 'article-topics':
    case 'anonymize':
    case 'enhances':
    case 'sentences':
    case 'highlights':
      return true;
    default:
      return false;
  }
}

const isClusteringLabel = (skillName: any) => {
  return skillName?.split(' ').pop() === 'Clustering';
};

const isClusterable = (skillEndpoint: string | undefined) => {
  if (skillEndpoint) {
    return [
      'highlights',
      'sentences',
      'entities',
      'emotions',
      'sentiments',
      'business-entities',
      'action-items',
      'keywords',
      'clustering',
    ].includes(skillEndpoint || '');
  }
  return false;
};

export function randomString(length: number) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString: string = '';

  for (let i = 0; i < length; i++) {
    let randomPoz = Math.floor(Math.random() * characters.length);
    randomString += characters.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

export function LightenDarkenColor(col: string, amt: number): string {
  var usePound = false;
  if (col[0] == '#') {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col, 16);

  var r = (num >> 16) + amt;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  var b = ((num >> 8) & 0x00ff) + amt;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  var g = (num & 0x0000ff) + amt;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}
