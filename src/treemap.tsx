import * as d3 from 'd3';
import React, { useEffect, useState } from 'react';
import { LightenDarkenColor, randomString } from './utils';

export const TreeMap = ({
  dataLabel,
  level,
  height,
  setFather,
  width,
}: any) => {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  if (isSSR) {
    return null;
  }

  if (dataLabel.children.length === 0) {
    return null;
  }

  return (
    <Tree
      height={height}
      width={width}
      data={dataLabel}
      level={level}
      setFather={setFather}
    />
  );
};

const countTotalElementsValue = (children: Array<any>) => {
  return children.reduce((a: number, b: any) => a + b.items_count, 0);
};

const Tree = ({ height, width, data, level, setFather }: any) => {
  const ref = React.useRef<any>(null);
  const [, setSvgRerender] = useState('');

  // Without this part, the svg will not be re-rendered
  React.useEffect(() => {
    setSvgRerender(randomString(10));
  }, [data, setSvgRerender]);

  const elementsValues = data.children.map((item: any) => item.items_count);
  const maxElementValue = Math.max(...elementsValues);
  const minElementValue = Math.min(...elementsValues);
  const elementsSum = countTotalElementsValue(data.children);
  const growFactor =
    maxElementValue > elementsSum * 0.9
      ? 0.1 / (1 - maxElementValue / elementsSum)
      : 1;
  let arrCounter = 1;

  React.useEffect(() => {
    // Sorts array from smallest to biggest (left to right)
    data?.children?.sort((a: any, b: any) => {
      if (a.others || b.others) return 1; // Sets Others the last square.
      return b.items_count - a.items_count;
    });

    // Fixes "Others" square, moving it to the end of the array
    if (data?.children[0]?.others) {
      const othersItem = data?.children?.shift();
      data?.children?.push(othersItem);
    }
  }, [data]);

  const calculateFontSize = (d: any) => {
    const height = d.y1 - d.y0;
    const width = d.x1 - d.x0;
    const area = height * width;
    let fontSize = 10 + (32 * area) / (250000 - 15000);
    fontSize = Math.max(fontSize, 10);
    fontSize = Math.min(fontSize, 60);
    return fontSize;
  };

  const fillColor = () => {
    const res = LightenDarkenColor('#031f38', 10 + 5 * arrCounter);
    arrCounter += 1;
    if (arrCounter >= 17) return LightenDarkenColor('#031f38', 10 + 5 * 16);

    return res;
  };

  // const tooltip = (d: any, height: number, width: number) => {
  const tooltip = (d: any) => {
    return d.data.phrases === undefined || d.data?.phrases.length === 0
      ? ''
      : `
        <div style="padding: 20px 10px; background: #1D1C27; color: white; font-size: 14px; overflow-y: auto; border-radius: 8px; font-family: 'Poppins', sans-serif;">
          <div style="padding-bottom: 16px;">
            <u style="font-size: 18px;">${
              d.data.phrases?.sort((a: any, b: any) => {
                return b.items_count - a.items_count;
              })[0].text
            }</u>
          </div>
          <div style="text-align: left; display: grid; grid-template-columns: 1fr auto; gap: 10px 20px; font-weight: 300; font-family: 'Poppins', sans-serif;">
            ${d.data.phrases
              ?.sort((a: any, b: any) => {
                return b.items_count - a.items_count;
              })
              ?.map(
                (item: any) =>
                  `<div><i>“${item.text}”</i></div><div><span style="color: #7D7D7D};">x</span>${item.items_count}</div>`
              )
              .join('')}
          </div>
        </div>`;
  };

  const svg = d3.select(ref.current);

  const setTooltipPosition = (event: any) => {
    const svg = document.getElementById('clustering__svg');
    let topValue = `${event.pageY - 20}px`;
    let bottomValue = 'auto';
    let leftValue = `${event.pageX + 20}px`;
    let rightValue = 'auto';
    if (svg !== null) {
      const svgRect = document.body.getBoundingClientRect();
      if (event.pageY > svgRect.height / 2) {
        topValue = 'auto';
        bottomValue = `${svgRect.height - event.pageY - 20}px`;
      }
      if (event.pageX > svgRect.width / 2) {
        leftValue = 'auto';
        rightValue = `${svgRect.width - event.pageX + 20}px`;
      }
    }
    return tooltip2
      .style('top', topValue)
      .style('bottom', bottomValue)
      .style('left', leftValue)
      .style('right', rightValue);
  };

  const root = d3.hierarchy(data).sum(function(d: any) {
    // return d.value;
    // return d.value * growFactor * (1 - d.value / maxElementValue);
    // return d.value > maxElementValue * 0.05 ? d.value : d.value * growFactor;
    const val =
      maxElementValue === d.items_count
        ? d.items_count
        : d.items_count * growFactor;

    let res = Math.max(val, maxElementValue * 0.035);

    if (d?.others) {
      const val = minElementValue * growFactor;
      res = Math.max(val, maxElementValue * 0.035) * 0.9;
    }

    return res;
    // let res = d.value;
    // const totalElements = countTotalElements(data.children.map);
    // if (data.children.length > 1) {
    //   res = Math.min(res, totalElements * 0.2);
    // }
    // return Math.max(d.value, 100 / data.children.length);
    // return res;
  }); // Here the size of each leave is given in the 'value' field in input data
  // Then d3.treemap computes the position of each element of the hierarchy
  // d3.treemap().size([width, height]).padding(0)(root);
  d3
    .treemap()
    .size([width, height])
    .padding(0)(root);
  // d3.treemap().padding(0)(root);

  // use this information to add rectangles:
  svg
    .selectAll('rect')
    .data(root.leaves())
    .join('rect')
    .on('click', (_: any, rect: any) => {
      setFather(rect.data.text);
    })
    .attr('x', (d: any) => d.x0)
    .attr('y', (d: any) => d.y0)
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('height', (d: any) => d.y1 - d.y0)
    .style('fill', (_: any) => fillColor())
    .style('font-weight', '300')
    .style('font-family', "'Poppins', sans-serif")
    .style('cursor', 'pointer');

  const tooltip2 = d3
    .select('body')
    .append('div')
    .attr('id', 'clustering__svg__tooltip2')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style('max-width', '600px')
    .style('max-height', '600px');

  svg
    .selectAll('foreignObject')
    .data(root.leaves())
    .join('foreignObject')
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('height', (d: any) => d.y1 - d.y0)
    .attr('x', (d: any) => d.x0) // +10 to adjust position (more right)
    .attr('y', (d: any) => d.y0)
    .on('mouseover', function(event: any, d: any) {
      document.getElementById('clustering__svg__tooltip')?.remove();
      return setTooltipPosition(event)
        .html(
          `<div id="clustering__svg__tooltip" style="max-height: 600px; overflow-y: auto;">${tooltip(
            d
          )}</div>`
        )
        .style('visibility', 'visible');
    })
    .on('mousemove', (event: any, _: any) => setTooltipPosition(event))
    .on('mouseout', () => tooltip2.style('visibility', 'hidden'))
    .html((d: any, _: any) => {
      const height = d.y1 - d.y0;
      // const width = d.x1 - d.x0;
      const fontSize = calculateFontSize(d);
      const lineHeight = fontSize * 1.1 + 5;
      const paddingY = 10;
      let lines = Math.floor((height - paddingY + 20) / lineHeight) - 3; // -2 is for the d.data.value and <br />, 20 is for the value absolute top padding
      lines = Math.max(lines, 1);
      return `
      <span style="position: relative; height: 100%; padding: 
      ${true ? '3px;' : '5px;'}
       display: grid; align-items: center; cursor: 
      ${level >= 1 ? 'auto' : 'pointer'}; font-size: ${fontSize}px">
        <span>
          <span data-element="rect-text" style="line-height: ${lineHeight}px; word-break: break-word; display: -webkit-box; -webkit-line-clamp: ${lines}; -webkit-box-orient: vertical; overflow: hidden; padding-top: ${
        lines === 1 && height < 100 ? '25px' : 0
      } -webkit-touch-callout: none;
  ">${d.data.text}</span>
          <span style="position: absolute; top: ${
            true ? '5px;' : '10px;'
          } left: ${true ? '5px;' : '10px;'} font-size: 14px; color: #D0CBCB;">
            ${d.data.items_count}
          </span>
        </span>
      </span>`;
    })
    .on('click', (event: any, rect: any) => {
      if (event.target.dataset?.element === 'rect-text') {
        if (window.getSelection()?.toString().length === 0)
          setFather(rect.data.text);
      } else setFather(rect.data.text);
      tooltip2.style('visibility', 'hidden');
    })
    .style('color', 'white')
    .style('text-align', 'center')
    .style('overflow', 'none')
    .style('user-select', 'none')
    .style('color', 'white')
    .style('font-weight', '300')
    .style('font-family', "'Poppins', sans-serif")
    .style('text-align', 'center');

  return (
    <svg
      id="clustering__svg"
      style={{
        height: '100%',
        width: '100%',
        borderRadius: level ? '0 0 4px 4px' : '4px',
      }}
      ref={ref}
    />
  );
};
