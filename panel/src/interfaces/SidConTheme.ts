import { type GlobalThemeOverrides } from 'naive-ui';

// 1. 定义调色板 (魔法与奥术风格 - Magic & Arcane)
export const sidConPalette = {
  primary: '#d4af37',        // 奥术金 (Arcane Gold)
  primaryHover: '#f7dc6f',   // 辉光金
  primaryPressed: '#9a7d0a', // 古铜金
  primarySuppl: 'rgba(212, 175, 55, 0.2)', // 魔法光晕

  info: '#a569bd',           // 秘法紫 (Arcane Purple)
  success: '#27ae60',        // 森林绿 (Forest Green)
  warning: '#e67e22',        // 火焰橙 (Fire Orange)
  error: '#c0392b',          // 鲜血红 (Blood Red)

  bgBase: '#150b21',         // 虚空黑 (Void Black)
  bgCard: 'rgba(35, 20, 50, 0.9)', // 黑曜石/羊皮纸背景
  bgOverlay: 'rgba(10, 5, 15, 0.95)', // 模态框深色背景
  
  textBase: '#e8dcc5',       // 羊皮纸白 (Parchment)
  textDim: 'rgba(232, 220, 197, 0.6)', // 褪色文字
  
  border: 'rgba(212, 175, 55, 0.4)', // 魔法边框
  borderStrong: 'rgba(212, 175, 55, 0.8)', // 强力结界
};

// 2. 定义字体栈 (优先使用古典魔法字体)
const fontStack = '"MedievalSharp", "Georgia", "Times New Roman", serif';
const titleFontStack = '"Cinzel", "Trajan Pro", "Times New Roman", serif';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const createButtonVariant = (color: string, typeSuffix: string = '') => {
  const suffix = typeSuffix;
  return {
    // 1. 文本颜色：常态为金色/主题色，悬浮为亮白
    [`textColor${suffix}`]: color,
    [`textColorHover${suffix}`]: '#ffffff',
    [`textColorPressed${suffix}`]: '#ffffff',
    [`textColorFocus${suffix}`]: color,
    [`textColorDisabled${suffix}`]: hexToRgba(color, 0.5),
    
    // 2. 边框颜色
    [`border${suffix}`]: `1px solid ${color}`,
    [`borderHover${suffix}`]: `1px solid ${color}`,
    [`borderPressed${suffix}`]: `1px solid ${color}`,
    [`borderFocus${suffix}`]: `1px solid ${color}`,
    [`borderDisabled${suffix}`]: `1px solid ${hexToRgba(color, 0.5)}`,

    // 3. 背景颜色：常态透明，悬浮出现魔法光晕
    [`color${suffix}`]: 'transparent', 
    [`colorHover${suffix}`]: hexToRgba(color, 0.2),
    [`colorPressed${suffix}`]: hexToRgba(color, 0.4),
    [`colorFocus${suffix}`]: hexToRgba(color, 0.2),
    [`colorDisabled${suffix}`]: 'transparent',
    
    [`rippleColor${suffix}`]: color, 
  };
};

export const sidConThemeOverrides: GlobalThemeOverrides = {
  common: {
    // 基础色
    primaryColor: sidConPalette.primary,
    primaryColorHover: sidConPalette.primaryHover,
    primaryColorPressed: sidConPalette.primaryPressed,
    primaryColorSuppl: sidConPalette.primarySuppl,
    
    infoColor: sidConPalette.info,
    successColor: sidConPalette.success,
    warningColor: sidConPalette.warning,
    errorColor: sidConPalette.error,

    // 背景与文字
    bodyColor: sidConPalette.bgBase,
    cardColor: sidConPalette.bgCard,
    modalColor: sidConPalette.bgOverlay,
    popoverColor: sidConPalette.bgOverlay,
    textColorBase: sidConPalette.textBase,
    textColor1: sidConPalette.textBase,
    textColor2: sidConPalette.textBase,
    textColor3: sidConPalette.textDim,

    // 字体与圆角 - 风格化调整
    fontFamily: fontStack,
    fontFamilyMono: fontStack, // 魔法书中等宽字体较少，混用衬线体
    borderRadius: '4px',       // 古典风格稍微带一点圆角 (羊皮纸边缘)
    borderRadiusSmall: '2px',
    
    // 全局边框
    borderColor: sidConPalette.border,
  },
  
  // --- 组件级定制 ---
  
  Button: {
    // 按钮增加古典边框感
    border: `1px solid ${sidConPalette.border}`,
    borderHover: `1px solid ${sidConPalette.primaryHover}`,
    borderPressed: `1px solid ${sidConPalette.primaryPressed}`,
    borderFocus: `1px solid ${sidConPalette.primary}`,
    
    textColor: sidConPalette.primary,
    textColorHover: '#fff',
    textColorPressed: '#fff',
    textColorFocus: sidConPalette.primary,
    
    // 字体使用标题衬线体
    fontWeight: '700',
    fontFamily: titleFontStack,
    
    ...createButtonVariant(sidConPalette.primary, ''),
    ...createButtonVariant(sidConPalette.primary, 'Primary'),
    ...createButtonVariant(sidConPalette.info, 'Info'),
    ...createButtonVariant(sidConPalette.success, 'Success'),
    ...createButtonVariant(sidConPalette.warning, 'Warning'),
    ...createButtonVariant(sidConPalette.error, 'Error'),
  },
  
  Card: {
    // 卡片背景
    color: sidConPalette.bgCard,
    borderColor: sidConPalette.border,
    textColor: sidConPalette.textBase,
    titleTextColor: sidConPalette.primary,
    titleFontWeight: '700',
    fontFamily: fontStack,
  },
  
  Input: {
    // 像古老的输入石板或魔法卷轴
    color: 'rgba(0, 0, 0, 0.3)',
    colorFocus: 'rgba(20, 10, 30, 0.5)',
    border: `1px solid ${sidConPalette.border}`,
    borderHover: `1px solid ${sidConPalette.primary}`,
    borderFocus: `1px solid ${sidConPalette.primary}`,
    boxShadowFocus: `0 0 8px ${sidConPalette.primarySuppl}`,
    textColor: sidConPalette.textBase,
    caretColor: sidConPalette.primary,
  },
  
  Select: {
    peers: {
      InternalSelection: {
        color: 'rgba(0, 0, 0, 0.3)',
        border: `1px solid ${sidConPalette.border}`,
        borderHover: `1px solid ${sidConPalette.primary}`,
        borderActive: `1px solid ${sidConPalette.primary}`,
        textColor: sidConPalette.textBase,
      },
      InternalSelectMenu: {
        color: sidConPalette.bgOverlay,
        optionTextColor: sidConPalette.textBase,
        optionTextColorActive: sidConPalette.primary,
        optionCheckColor: sidConPalette.primary,
      }
    }
  },

  DataTable: {
    // 魔法账本风格
    thColor: 'rgba(212, 175, 55, 0.1)', // 金色微光表头
    thTextColor: sidConPalette.primary,
    thFontWeight: '700',
    thFontFamily: titleFontStack,
    tdColor: 'transparent',
    tdTextColor: sidConPalette.textBase,
    borderColor: sidConPalette.border,
    tdColorHover: 'rgba(212, 175, 55, 0.1)',
  },
  
  Dialog: {
    // 魔法契约/提示框
    color: sidConPalette.bgOverlay,
    border: `1px solid ${sidConPalette.primary}`,
    titleTextColor: sidConPalette.primary,
    titleFontFamily: titleFontStack, // 标题使用衬线体
    textColor: sidConPalette.textBase,
    iconColor: sidConPalette.primary,
    headerBorderBottom: `1px solid ${sidConPalette.border}`,
  },

  Alert: {
    color: 'rgba(35, 20, 50, 0.8)',
    border: `1px solid ${sidConPalette.border}`,
    titleTextColor: sidConPalette.primary,
    contentTextColor: sidConPalette.textBase,
  },

  Tooltip: {
    color: 'rgba(15, 5, 20, 0.95)',
    textColor: sidConPalette.primary,
    border: `1px solid ${sidConPalette.border}`,
  },
  
  Divider: {
    color: sidConPalette.border,
  },
  
  Typography: {
    headerFontColor: sidConPalette.primary,
    headerFontFamily: titleFontStack,
  }
};