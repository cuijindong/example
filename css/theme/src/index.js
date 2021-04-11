import './css/index.scss'

let theme = 'light'
document.getElementById('but').onclick = function () {
  theme = theme === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('theme', theme)
}