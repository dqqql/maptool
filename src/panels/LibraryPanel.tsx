import { useRef, useState } from 'react';
import { BUILTIN_ASSETS } from '../assets/builtin';
import { useLibraryStore } from '../store/libraryStore';
import type { Asset } from '../types';
import './LibraryPanel.css';

interface Props {
  onPlace: (asset: Asset) => void;
}

type LibraryTab = 'builtin' | 'user';

function onDragStart(e: React.DragEvent, asset: Asset) {
  e.dataTransfer.setData('application/x-asset-id', asset.id);
  e.dataTransfer.setData('application/x-asset-name', asset.name);
  e.dataTransfer.effectAllowed = 'copy';
}

export function LibraryPanel({ onPlace }: Props) {
  const user = useLibraryStore((s) => s.user);
  const uploadFiles = useLibraryStore((s) => s.uploadFiles);
  const renameUserAsset = useLibraryStore((s) => s.renameUserAsset);
  const removeUserAsset = useLibraryStore((s) => s.removeUserAsset);

  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>('builtin');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const visibleAssets = activeTab === 'builtin' ? BUILTIN_ASSETS : user;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const count = await uploadFiles(files);
    if (count > 0) setActiveTab('user');
    if (fileRef.current) fileRef.current.value = '';
  }

  function startRename(asset: Asset) {
    setEditingId(asset.id);
    setDraft(asset.name);
  }

  async function commitRename() {
    if (editingId) await renameUserAsset(editingId, draft);
    setEditingId(null);
  }

  async function handleRemoveAsset(id: string) {
    try {
      await removeUserAsset(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function thumb(asset: Asset) {
    return (
      <div className="lib__item-wrap" key={asset.id}>
        <button
          className="lib__item"
          draggable
          title={`拖入画布放置「${asset.name}」`}
          onDragStart={(e) => onDragStart(e, asset)}
          onDoubleClick={() => onPlace(asset)}
        >
          <span className="lib__thumb">
            <img src={asset.dataUrl} alt={asset.name} draggable={false} />
          </span>
          {editingId === asset.id ? (
            <input
              className="lib__rename"
              autoFocus
              value={draft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingId(null);
              }}
            />
          ) : (
            <span className="lib__name">{asset.name}</span>
          )}
        </button>
        {!asset.builtin && (
          <div className="lib__item-tools">
            <button className="lib__tool" title="重命名" onClick={() => startRename(asset)}>✎</button>
            <button className="lib__tool lib__tool--del" title="删除素材" onClick={() => handleRemoveAsset(asset.id)}>✕</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="rail rail--left grain-overlay">
      <div className="rail__head">素材库</div>
      <div className="rail__sub">Material Codex</div>

      <div className="lib">
        <div className="lib__tabs" role="tablist" aria-label="素材来源">
          <button
            className="lib__tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'builtin'}
            onClick={() => setActiveTab('builtin')}
          >
            内置素材
          </button>
          <button
            className="lib__tab"
            type="button"
            role="tab"
            aria-selected={activeTab === 'user'}
            onClick={() => setActiveTab('user')}
          >
            我的素材
          </button>
        </div>

        {activeTab === 'user' && (
          <div className="lib__actions">
            <button className="lib__upload" onClick={() => fileRef.current?.click()}>
              + 上传素材
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {activeTab === 'user' && user.length === 0 ? (
          <p className="lib__empty">上传 PNG / JPG / WEBP / SVG，化作你自己的图记。</p>
        ) : (
          <div className="lib__grid">{visibleAssets.map((asset) => thumb(asset))}</div>
        )}
      </div>

      <p className="lib__hint">拖入画布，或双击落在视图中心</p>
    </aside>
  );
}
