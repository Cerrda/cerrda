/**
 * 主题焚烧切换的共享状态（供 Header 隐藏阅读进度等）
 */
export function useThemeBurn() {
  const active = useState('theme-burn-active', () => false)
  return { active }
}
