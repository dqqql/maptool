import { builtinByGroup } from '../assets/builtin';
import type { Asset } from '../types';
import './LibraryPanel.css';

interface Props {
  /** 双击 / 拖入时回调（用于无拖拽场景，落在视图中心）*/
  onPlace: (asset: Asset) => void;
}

function onDragStart(e: React.DragEvent, asset: Asset) {
  e.dataTransfer.setData('application/x-asset-id', asset.id);
  e.dataTransfer.setData('application/x-asset-name', asset.name);
  e.dataTransfer.effectAllowed = 'copy';
}

export function LibraryPanel({ onPlace }: Props) {
  const groups = builtinByGroup();

  return (
    <aside className="rail rail--left grain-overlay">
      <div className="rail__head">素材库</div>
      <div className="rail__sub">Material Codex</div>

      <div className="lib">
        {groups.map(({ group, assets }) => (
          <section className="lib__group" key={group}>
            <h4 className="lib__group-title">{group}</h4>
            <div className="lib__grid">
              {assets.map((a) => (
                <button
                  key={a.id}
                  className="lib__item"
                  draggable
                  title={`拖入画布放置「${a.name}」`}
                  onDragStart={(e) => onDragStart(e, a)}
                  onDoubleClick={() => onPlace(a)}
                >
                  <span className="lib__thumb">
                    <img src={a.dataUrl} alt={a.name} draggable={false} />
                  </span>
                  <span className="lib__name">{a.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="lib__hint">拖入画布 · 或双击落于视图中心</p>
    </aside>
  );
}
