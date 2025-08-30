# Dracula Theme Enhancement Wishlist

## 🎨 Theme Contrast & Visibility Issues

### Critical Issues (High Priority)

#### 1. ✅ Input Fields - FIXED
- **Problem**: Input fields blend into the background, making them nearly invisible
- **Solution Implemented**: 
  - Changed input background to `#44475A` (Selection) 
  - Added `#6272A4` (Comment) borders
  - Focus state shows `#BD93F9` (Purple) border with outline
  - **STATUS**: ✅ COMPLETED

#### 2. ✅ Dropdown/Select Elements - FIXED
- **Problem**: Theme selector dropdown has no visible borders or background
- **Solution Implemented**: 
  - Added clear borders using `#6272A4`
  - Background set to `#44475A` (Selection)
  - Focus state shows purple highlight
  - **STATUS**: ✅ COMPLETED

#### 3. ✅ Code Editor/JSON Editor - FIXED
- **Problem**: The profiles configuration JSON editor lacks proper syntax highlighting
- **Solution Implemented**: Full Dracula syntax highlighting added
  - Strings: `#F1FA8C` (Yellow) ✅
  - Keys/Properties: `#8BE9FD` (Cyan) ✅
  - Numbers: `#BD93F9` (Purple) ✅
  - Brackets: `#F8F8F2` (Foreground) ✅
  - Comments: `#6272A4` (Comment) ✅
  - Background: Darker than main background for contrast ✅
  - Line numbers with gutter styling ✅
  - **STATUS**: ✅ COMPLETED

### Medium Priority Issues

#### 4. Button States - INSUFFICIENT FEEDBACK
- **Problem**: Hover and active states are not distinct enough
- **Current**: Minimal hover effect
- **Solution**:
  - Primary buttons: Add purple glow on hover
  - Secondary buttons: Lighten background on hover
  - Disabled state: Reduce opacity to 0.5

#### 5. ✅ Scrollbars - FIXED
- **Problem**: Scrollbars blend into the background
- **Solution Implemented**: 
  - Track: `#44475A` (Selection) ✅
  - Thumb: `#6272A4` (Comment) ✅
  - Hover thumb: `#BD93F9` (Purple) ✅
  - **STATUS**: ✅ COMPLETED

#### 6. Toggle Switches - UNCLEAR STATE
- **Problem**: ON/OFF states not visually distinct
- **Current**: Minimal color difference
- **Solution**:
  - OFF: `#44475A` background
  - ON: `#50FA7B` (Green) or `#BD93F9` (Purple)
  - Add transition animation

### Low Priority Enhancements

#### 7. Tooltips - MISSING DRACULA STYLE
- **Problem**: Using default tooltip styling
- **Solution**: 
  - Background: `#44475A` (Selection)
  - Text: `#F8F8F2` (Foreground)
  - Border: `#6272A4` (Comment)

#### 8. Modal/Dialog Overlays - TOO DARK
- **Problem**: Modal backgrounds are too dark
- **Solution**: 
  - Overlay: `rgba(40, 42, 54, 0.8)`
  - Modal background: `#282A36` with `#44475A` border

#### 9. Tab Navigation - UNCLEAR ACTIVE TAB
- **Problem**: Active tab not clearly distinguished
- **Solution**:
  - Active tab: `#44475A` background with `#BD93F9` bottom border
  - Inactive tabs: Transparent with `#6272A4` text

#### 10. Status Indicators - INCONSISTENT
- **Problem**: Success/Error/Warning states not using Dracula colors consistently
- **Solution**:
  - Success: `#50FA7B` (Green)
  - Error: `#FF5555` (Red)
  - Warning: `#F1FA8C` (Yellow)
  - Info: `#8BE9FD` (Cyan)

## 📝 Specific Component Fixes Needed

### Settings Page
1. **Theme Dropdown**: Add border and background
2. **Profile Selector**: Better contrast for dropdown
3. **JSON Editor**: Full syntax highlighting
4. **Save Button**: More prominent with purple accent
5. **Section Headers**: Use purple accent color

### Project Page
1. **Project Cards**: Add subtle border using Selection color
2. **Status Badge**: Use proper Dracula status colors
3. **Create Button**: Purple accent with glow effect

### Task Page
1. **Task Cards**: Better shadow and border
2. **Diff Viewer**: Already fixed but needs testing
3. **Console Output**: Ensure ANSI colors match Dracula

## 🎯 Implementation Priority

1. **URGENT**: Fix input field visibility (all inputs, selects, textareas)
2. **HIGH**: Fix dropdown menus and selects
3. **HIGH**: Add proper borders throughout
4. **MEDIUM**: Enhance button states and feedback
5. **MEDIUM**: Fix scrollbar styling
6. **LOW**: Polish tooltips and modals

## 🔧 CSS Variables to Add/Modify

```css
.dracula {
  /* Inputs need better contrast */
  --_input: 232 14% 31%; /* Use Selection instead of AnsiBlack */
  --_input-border: 225 27% 51%; /* Comment color for borders */
  --_input-focus-border: 265 89% 78%; /* Purple on focus */
  
  /* Scrollbars */
  --_scrollbar-track: 232 14% 31%;
  --_scrollbar-thumb: 225 27% 51%;
  --_scrollbar-thumb-hover: 265 89% 78%;
  
  /* Additional states */
  --_hover-bg: 232 14% 35%; /* Slightly lighter than Selection */
  --_active-bg: 232 14% 38%;
  --_disabled-opacity: 0.5;
}
```

## ✅ Testing Checklist

- [ ] All input fields are clearly visible
- [ ] Dropdowns have visible borders
- [ ] JSON editor has syntax highlighting
- [ ] Buttons have clear hover states
- [ ] Scrollbars are visible
- [ ] Toggle switches show clear ON/OFF
- [ ] Active tabs are clearly marked
- [ ] Status colors are consistent
- [ ] Code blocks use Dracula syntax
- [ ] All text has sufficient contrast

## 🚀 Next Steps

1. Update CSS with input field fixes
2. Add border styles for all interactive elements
3. Implement hover and focus states
4. Test with Playwright automation
5. Get user feedback on improvements