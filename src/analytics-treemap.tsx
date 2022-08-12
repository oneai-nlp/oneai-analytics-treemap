import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import unescape from 'lodash/unescape';
import * as React from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { TreeMap } from './treemap';

type AnalyticsTreemapProps = {
  clusters: Array<Cluster> | any;
};

interface Cluster {
  skill: string;
  text: string;
  items_count: number;
  span_text: string;
  phrases: Array<Phrase>;
}

interface Phrase {
  text: string;
  items_count: number;
  phrases?: { [key: string]: number };
}

export default function AnalyticsTreemap({ clusters }: AnalyticsTreemapProps) {
  const json = clusters;
  const SQUARES_LIMIT = 30;
  const { width, height, ref } = useResizeDetector();
  const [chosenCategory, setChosenCategory] = React.useState<any>('All');
  const [currentCluster, setCurrentCluster] = React.useState<any>({
    clusterName: '',
    clusterCount: 0,
  });
  const [level, setLevel] = React.useState<number>(0);
  const [chart, _setChart] = React.useState<any>({
    children: [],
  });
  if (!json) {
    return <div>Please pass clusters array to AnalyticsTreemap</div>;
  }
  const setChart = (data: any) => {
    _setChart({
      ...data,
      children: data.children?.slice(0, SQUARES_LIMIT),
    });
  };

  function fetchCategoryItems() {
    try {
      if (json) {
        // Clones the array so we can use it without mutating the original
        const clonedArray = cloneDeep(json);

        // Gets the labels from the JSON with the format we need
        const fullArray = formatJSONForLabels(clonedArray);

        // Groups the labels by skill
        const groupedBy: any = groupBy(fullArray, 'skill');

        // All is the initial state, but we actually show the first skill (see useEffect)
        if (chosenCategory !== 'All') {
          // Checks whether we have too many squares
          if (groupedBy[chosenCategory]?.length >= SQUARES_LIMIT) {
            let counter = 0;
            for (
              let i = SQUARES_LIMIT;
              i < groupedBy[chosenCategory].length;
              i++
            )
              counter += groupedBy[chosenCategory][i].items_count;

            groupedBy[chosenCategory] = groupedBy[chosenCategory].splice(
              0,
              SQUARES_LIMIT - 1
            );

            const isOthersExists = groupedBy[chosenCategory]?.some(
              (label: any) => label.text === 'Others'
            );

            // Show "Others" if it doesn't exist, or "Other Values" if it does.
            groupedBy[chosenCategory].push({
              text: isOthersExists ? 'Other Values' : 'Others',
              items_count: counter,
              position: groupedBy[chosenCategory]?.length,
              others: true,
            });
          }
          const groupByData = groupedBy[chosenCategory]?.map(
            (item: any, index: number) => {
              // Action items get a different format
              if (item?.skill === 'action-items') {
                return item?.phrases?.map(
                  (phrase: any, phraseIndex: number) => {
                    return {
                      text: phrase.text,
                      items_count: phrase?.items_count,
                      position: phraseIndex,
                      ...(phrase.others && { others: true }),
                    };
                  }
                );
              }
              return {
                text: item.text ? item.text : item?.cluster_phrase,
                items_count: item.items_count,
                position: index,
                ...(item.others && { others: true }),
              };
            }
          );

          const childrenArray: any = {
            children: [],
          };

          try {
            childrenArray.children = groupByData.flat();
          } catch (e) {
            childrenArray.children = groupByData;
          }

          if (!isEqual(childrenArray, chart)) {
            const newLevel = level ? level - 1 : 0;
            setLevel(newLevel);
            setChart(childrenArray);
          }
        } else {
          if (json) {
            let clonedJson = cloneDeep(fullArray);

            if (clonedJson?.length >= SQUARES_LIMIT) {
              let counter = 0;
              for (let i = SQUARES_LIMIT; i < clonedJson.length; i++) {
                counter += clonedJson[i].items_count;
              }
              clonedJson = clonedJson?.splice(0, SQUARES_LIMIT - 1);

              const isOthersExists = clonedJson?.some(
                (label: any) => label.text === 'Others'
              );

              clonedJson.push({
                text: isOthersExists ? 'Other Values' : 'Others',
                items_count: counter,
                position: clonedJson?.length,
                others: true,
              });
            }
            const newArray = clonedJson?.map((item: any, index: any) => {
              return {
                text: item.text ? item.text : item?.cluster_phrase,
                items_count: item.items_count,
                position: index,
                //phrases: item?.phrases || [],
              };
            });
            const childrenArray = {
              children: [],
            };

            setCurrentCluster({
              clusterCount: 0,
              clusterName: '',
            });
            childrenArray.children = newArray;
            if (!isEqual(childrenArray, chart)) {
              const newLevel = level ? level - 1 : 0;
              setLevel(newLevel);
              setChart(childrenArray);
            }
            if (childrenArray) {
              setChart(childrenArray);
            }
          }
        }
      }
    } catch (e) {
      console.error(
        '[Clustering]fetchCategoryItems error, Could not parse JSON object:',
        e
      );
    }
  }

  React.useMemo(() => {
    let allLabels;
    try {
      allLabels = formatJSONForLabels(json)?.map((item: any) => item?.skill);
    } catch (error) {
      // handle CLUSTERING_ERROR
      return [];
    }

    const allCategories = Array.from(new Set(allLabels.flat()));

    if (allCategories.includes('origin'))
      delete allCategories[allCategories.indexOf('origin')];

    setChosenCategory(allCategories[0]);
    setCurrentCluster({
      clusterCount: 0,
      clusterName: '',
    });

    let clonedJson = formatJSONForLabels(cloneDeep(json));

    if (clonedJson.length >= SQUARES_LIMIT) {
      let counter = 0;
      for (let i = SQUARES_LIMIT; i < clonedJson?.length; i++) {
        counter += clonedJson[i].items_count;
      }
      clonedJson = clonedJson.splice(0, SQUARES_LIMIT - 1);

      const isOthersExists = clonedJson?.some(
        (label: any) => label.text === 'Others'
      );

      clonedJson.push({
        text: isOthersExists ? 'Other Values' : 'Others',
        items_count: counter,
        others: true,
        position: clonedJson.length,
      });
      return clonedJson;
    }

    const newArray = clonedJson?.map((item: any, index: any) => {
      return {
        text: item.text ? item?.text : item?.cluster_phrase,
        items_count: item.items_count,
        position: index,
      };
    });

    const childrenArray = {
      children: [],
    };
    childrenArray.children = newArray;

    if (childrenArray) {
      setChart(childrenArray);
    }
    //eslint-disable-next-line
  }, [json]);

  function setFather(itemName: any) {
    const clonedArray = cloneDeep(json);

    const filterName = formatJSONForLabels(clonedArray).filter((item: any) => {
      return item.text
        ? item.text === itemName && item.skill === chosenCategory
        : item.cluster_phrase === itemName;
    });
    let totalClusterCount = 0;

    if (filterName.length) {
      const newArray: any = [];
      filterName.forEach((value: any) => {
        // This part fixes the array

        if (value?.phrases?.length >= SQUARES_LIMIT - 1) {
          let otherChildrenCounters = 0;

          for (let i = SQUARES_LIMIT; i < value?.phrases?.length; i++) {
            otherChildrenCounters += value?.phrases[i]?.items_count;
          }
          value?.phrases?.splice(SQUARES_LIMIT, value?.phrases?.length);

          const isOthersExists = value?.phrases?.some(
            (phrase: any) => phrase.text === 'Others'
          );

          newArray.push({
            text: isOthersExists ? 'Other Values' : 'Others',
            items_count: otherChildrenCounters,
            position: value?.phrases?.length,
            others: true,
          });
          totalClusterCount += otherChildrenCounters;
        }

        value?.phrases?.forEach((item: any, index: any) => {
          newArray.push({
            text: item.text,
            items_count: item.items_count,
            position: index,
            phrases: item?.phrases
              ? Object.entries(item.phrases).map(v => {
                  return { text: v[0], items_count: v[1] };
                })
              : [],
          });
          totalClusterCount += item.items_count;
        });
      });
      let childrenArray: any = {
        children: [],
      };
      childrenArray.children = newArray;

      if (!isEqual(childrenArray, chart)) {
        if (level === 1) return;

        setChart(childrenArray);
        setLevel(1);
        setCurrentCluster({
          clusterName: itemName,
          clusterCount: totalClusterCount,
        });
      }
    }
  }

  React.useEffect(() => {
    fetchCategoryItems();
    //eslint-disable-next-line
  }, [chosenCategory, json]);

  console.debug('[OneAI AnalyticsTreemap] currentCluster:', currentCluster);
  return (
    <>
      <div className="OneAI__Analytics__wrapper">
        <div>
          <AnalyticsClusteringHeader
            currentCluster={currentCluster}
            fetchCategoryItems={fetchCategoryItems}
            level={level}
          />
        </div>
        <div className="OneAI__Analytics__treemap" ref={ref}>
          {chart && chart.children && (
            <TreeMap
              level={level}
              dataLabel={chart}
              width={Math.max(100, width || 100)}
              height={Math.max(100, height || 100)}
              setFather={setFather}
            />
          )}
        </div>
      </div>
      <AnalyticsTreemapStyle />
    </>
  );
}

const AnalyticsTreemapStyle = () => {
  return (
    <style>{`
      .OneAI__Analytics__wrapper {
        font-family: 'Poppins' !important;
        font-weight: 200 !important;
        height: 100%;
        display: grid;
        grid-template-rows: auto 1fr;
      }
      .OneAI__Analytics__treemap {
        height: 100%;
      }
  `}</style>
  );
};

type AnalyticsClusteringHeaderProps = {
  fetchCategoryItems: () => void;
  level: number;
  currentCluster: any;
};

function AnalyticsClusteringHeader({
  fetchCategoryItems,
  currentCluster,
  level,
}: AnalyticsClusteringHeaderProps) {
  return !level ? (
    <></>
  ) : (
    <>
      <div className="OneAI__Analytics__header">
        <div className="OneAI__Analytics__header__button_and_name">
          <button
            className="OneAI__Analytics__header__button"
            style={level ? {} : { visibility: 'hidden' }}
            onClick={() => fetchCategoryItems()}
          >
            <figure className="OneAI__Analytics__header__button_arrow">
              <IconLongArrowLeft />
            </figure>
            <span className="OneAI__Analytics__header__button_span">BACK</span>
          </button>
          <span className="OneAI__Analytics__header__cluster_name">
            {unescape(currentCluster.clusterName)}
          </span>
        </div>

        <span
          style={{ color: '#D0CBCB' }}
          className="OneAI__Analytics__header__cluster_count"
        >
          {currentCluster.clusterCount}
        </span>
      </div>
      <AnalyticsClusteringHeaderStyle />
    </>
  );
}

const AnalyticsClusteringHeaderStyle = () => {
  return (
    <style>{`
      .OneAI__Analytics__header {
        display: grid;
        grid-auto-flow: column;
        row-gap: 1rem;
        justify-content: space-between;
        -moz-column-gap: 0.5rem;
        column-gap: 0.5rem;
        align-items: center;
        padding-top: 1rem;
        padding-bottom: 1rem;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        background-color: rgb(59 58 160);
        border-bottom-width: 2px;
        border-color: rgb(0 0 0);
        border-top-left-radius: 0.25rem;
        border-top-right-radius: 0.25rem;
        border-bottom: 2px solid black;
      }
      
      .OneAI__Analytics__header__button_and_name {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        -moz-column-gap: 1rem;
        column-gap: 1rem;
        color: white;
      }

      .OneAI__Analytics__header__button {
        display: grid;
        border-radius: 4px;
        align-items: center;
        grid-template-columns: 1fr auto;
        -moz-column-gap: 1rem;
        column-gap: 1rem;
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        background-color: rgb(255 255 255);
        opacity: 0.3;
        color: #323040;
        cursor: pointer;
        border: none;
      }
      
      .OneAI__Analytics__header__button:hover {
        opacity: 0.5;
        background-color: rgb(255 255 255);
      }

      .OneAI__Analytics__header__button_span {
        display: grid;
        align-items: center;
        text-align: center;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .OneAI__Analytics__header__button_arrow {
        display: grid;
        align-items: center;
        text-align: center;
        margin: 0;
      }

      .OneAI__Analytics__header__cluster_name {
        font-size: 1.125rem;
        line-height: 1.75rem;
      }

      .OneAI__Analytics__header__cluster_count {
        color: #D0CBCB;
        font-size: 18px; 
        display: grid;
        justify-content: flex-end;
        padding-right: 1rem;
      }
  `}</style>
  );
};

const IconLongArrowLeft = () => {
  return (
    <svg
      width={'1em'}
      height={'1em'}
      viewBox="0 0 16 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.59839 11.1337L1.214 7.24277L5.59839 3.35183"
        stroke={'currentColor'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4285 7.24269L1.21405 7.24271"
        stroke={'currentColor'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function formatJSONForLabels(json: any, type: string = 'regular') {
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
