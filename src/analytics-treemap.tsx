import * as React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import unescape from 'lodash/unescape';
import { useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { TreeMap } from './treemap';
import { formatJSONForLabels } from './utils';

type AnalyticsTreemapProps = {
  clusters: Array<Cluster>;
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
  phrases?: { [key: string]: number | undefined };
}

export default function AnalyticsTreemap({ clusters }: AnalyticsTreemapProps) {
  const json = clusters;
  const SQUARES_LIMIT = 50;
  const { width, height, ref } = useResizeDetector();
  const [chosenCategory, setChosenCategory] = useState<any>('All');
  const [currentCluster, setCurrentCluster] = useState<any>({
    clusterName: '',
    clusterCount: 0,
  });
  const [level, setLevel] = useState<number>(0);
  const [chart, _setChart] = useState<any>({
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
      if (!json) return;
      // Clones the array so we can use it without mutating the original
      const clonedArray = cloneDeep(json);

      // Gets the labels from the JSON with the format we need
      const fullArray = formatJSONForLabels(clonedArray);

      // Groups the labels by skill
      const groupedBy: any = groupBy(fullArray, 'skill');

      // All is the initial state, but we actually show the first skill (see useEffect)
      if (chosenCategory !== 'All') {
        let chosenCategoryGroup = groupedBy[chosenCategory];
        // Checks whether we have too many squares
        if (chosenCategoryGroup?.length >= SQUARES_LIMIT) {
          let counter = 0;
          for (let i = SQUARES_LIMIT; i < chosenCategoryGroup.length; i++)
            counter += chosenCategoryGroup[i].items_count;

          chosenCategoryGroup = chosenCategoryGroup.splice(
            0,
            SQUARES_LIMIT - 1
          );

          const isOthersExists = chosenCategoryGroup?.some(
            (label: any) => label.text === 'Others'
          );

          // Show "Others" if it doesn't exist, or "Other Values" if it does.
          chosenCategoryGroup.push({
            text: isOthersExists ? 'Other Values' : 'Others',
            items_count: counter,
            position: chosenCategoryGroup?.length,
            others: true,
          });
        }

        const groupByData = chosenCategoryGroup?.map(
          (item: any, index: number) => {
            // Action items get a different format
            if (item?.skill === 'action-items') {
              return item?.phrases?.map((phrase: any, phraseIndex: number) => {
                return {
                  text: phrase.text,
                  items_count: phrase?.items_count,
                  position: phraseIndex,
                  ...(phrase.others && { others: true }),
                };
              });
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

    if (filterName.length === 0) return;

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
        font-family: 'Poppins', sans-serif !important;
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
