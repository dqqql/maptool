/* viewer 的素材解析：内置素材走代码常量，用户素材走 HTML 内嵌的 assets[]。 */
import type { Asset } from '../types';
import { getBuiltinAsset } from '../assets/builtin';

export function makeViewerAssetResolver(embedded: Asset[]): (id: string) => Asset | undefined {
  const byId = new Map(embedded.map((a) => [a.id, a]));
  return (id) => getBuiltinAsset(id) ?? byId.get(id);
}
