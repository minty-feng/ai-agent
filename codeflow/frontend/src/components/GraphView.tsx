import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../types';

const LANG_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  go: '#00add8',
  rust: '#ce422b',
  java: '#b07219',
  ruby: '#cc342d',
  php: '#777bb4',
  vue: '#41b883',
  svelte: '#ff3e00',
  csharp: '#68217a',
  cpp: '#f34b7d',
  c: '#aaaaaa',
  unknown: '#555568',
};

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
}

export function GraphView({ nodes, edges, selectedNode, onSelectNode }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getNodeRadius = (n: GraphNode) => {
    const base = 5;
    const extra = Math.min(n.blast_radius * 0.8, 14);
    return base + extra;
  };

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = containerRef.current.getBoundingClientRect();

    // Clone nodes/edges for simulation (D3 mutates them)
    const simNodes: GraphNode[] = nodes.map(n => ({ ...n }));
    const nodeById = new Map(simNodes.map(n => [n.id, n]));

    const simEdges: Array<{ source: GraphNode; target: GraphNode }> = edges
      .map(e => {
        const src = nodeById.get(typeof e.source === 'string' ? e.source : (e.source as GraphNode).id);
        const tgt = nodeById.get(typeof e.target === 'string' ? e.target : (e.target as GraphNode).id);
        return src && tgt ? { source: src, target: tgt } : null;
      })
      .filter((e): e is { source: GraphNode; target: GraphNode } => e !== null);

    // Zoom/pan group
    const g = svg.append('g').attr('class', 'root');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoom);

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#333345');

    // Edges
    const link = g.append('g').attr('class', 'links')
      .selectAll<SVGLineElement, { source: GraphNode; target: GraphNode }>('line')
      .data(simEdges)
      .enter().append('line')
      .attr('stroke', '#222230')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow)');

    // Node groups
    const node = g.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(simNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Circle
    node.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => LANG_COLORS[d.language] || '#555568')
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => d.security_count > 0 ? '#ff4466' : '#333345')
      .attr('stroke-width', d => d.security_count > 0 ? 2 : 1);

    // Security warning dot
    node.filter(d => d.security_count > 0)
      .append('circle')
      .attr('r', 4)
      .attr('cx', d => getNodeRadius(d) - 2)
      .attr('cy', d => -getNodeRadius(d) + 2)
      .attr('fill', '#ff4466');

    // Label
    node.append('text')
      .text(d => {
        const parts = d.path.split('/');
        return parts[parts.length - 1];
      })
      .attr('x', d => getNodeRadius(d) + 4)
      .attr('y', 4)
      .attr('font-size', 10)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#8888aa')
      .style('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('background', '#0f0f12')
      .style('border', '1px solid #333345')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('font-size', '11px')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('color', '#e8e8f0')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 10)
      .style('max-width', '280px');

    node
      .on('mouseover', (_event, d) => {
        tooltip.transition().duration(100).style('opacity', 1);
        tooltip.html(`
          <div style="color:#00ff9d;font-weight:700;margin-bottom:4px">${d.path.split('/').pop()}</div>
          <div style="color:#8888aa;word-break:break-all;margin-bottom:4px;font-size:10px">${d.path}</div>
          <div>Lang: <span style="color:#e8e8f0">${d.language}</span></div>
          <div>Blast radius: <span style="color:#ffcc00">${d.blast_radius}</span></div>
          ${d.security_count > 0 ? `<div>Security: <span style="color:#ff4466">${d.security_count} issues</span></div>` : ''}
        `);
      })
      .on('mousemove', (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        tooltip
          .style('left', (event.clientX - rect.left + 12) + 'px')
          .style('top', (event.clientY - rect.top - 10) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      })
      .on('click', (_, d) => {
        // Find original node
        const original = nodes.find(n => n.id === d.id);
        onSelectNode(original || null);
      });

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(simNodes)
      .force('link', d3.forceLink<GraphNode, { source: GraphNode; target: GraphNode }>(simEdges)
        .id(d => d.id)
        .distance(80)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => getNodeRadius(d) + 4))
      .on('tick', () => {
        link
          .attr('x1', d => (d.source as GraphNode).x ?? 0)
          .attr('y1', d => (d.source as GraphNode).y ?? 0)
          .attr('x2', d => (d.target as GraphNode).x ?? 0)
          .attr('y2', d => (d.target as GraphNode).y ?? 0);

        node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simRef.current = sim as unknown as d3.Simulation<GraphNode, GraphEdge>;

    // Highlight selected node
    if (selectedNode) {
      const selId = selectedNode.id;
      const directDeps = new Set(
        simEdges
          .filter(e => e.source.id === selId)
          .map(e => e.target.id)
      );
      const dependents = new Set(
        simEdges
          .filter(e => e.target.id === selId)
          .map(e => e.source.id)
      );

      node.select('circle')
        .attr('opacity', d => {
          if (d.id === selId || directDeps.has(d.id) || dependents.has(d.id)) return 1;
          return 0.15;
        })
        .attr('stroke', d => {
          if (d.id === selId) return '#00ff9d';
          if (directDeps.has(d.id)) return '#4488ff';
          if (dependents.has(d.id)) return '#ffcc00';
          return d.security_count > 0 ? '#ff4466' : '#333345';
        })
        .attr('stroke-width', d => {
          if (d.id === selId) return 3;
          if (directDeps.has(d.id) || dependents.has(d.id)) return 2;
          return d.security_count > 0 ? 2 : 1;
        });

      link
        .attr('stroke', e => {
          if (e.source.id === selId) return '#4488ff';
          if (e.target.id === selId) return '#ffcc00';
          return '#222230';
        })
        .attr('stroke-width', e => {
          if (e.source.id === selId || e.target.id === selId) return 2;
          return 0.5;
        })
        .attr('stroke-opacity', e => {
          if (e.source.id === selId || e.target.id === selId) return 1;
          return 0.1;
        });
    }

    // Initial fit
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    return () => {
      sim.stop();
      tooltip.remove();
    };
  }, [nodes, edges, selectedNode, onSelectNode]);

  useEffect(() => {
    const cleanup = renderGraph();
    return cleanup;
  }, [renderGraph]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => renderGraph());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [renderGraph]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <svg ref={svgRef} width="100%" height="100%" />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'var(--bg-panel)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '8px 12px', fontSize: 11,
        display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 340,
      }}>
        {Object.entries(LANG_COLORS).filter(([l]) => l !== 'unknown').slice(0, 8).map(([lang, color]) => (
          <span key={lang} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{lang}</span>
          </span>
        ))}
      </div>
      {/* Blast radius legend */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        background: 'var(--bg-panel)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--text-secondary)',
      }}>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Node size = blast radius</div>
        <div><span style={{ color: '#ff4466' }}>Red outline</span> = security issues</div>
      </div>
    </div>
  );
}
