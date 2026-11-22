# edcosys portal

Learner portal for the edcosys Flagship AI Course (Lesson 1.1: LLMs).
Plain HTML, CSS and JavaScript. No server, no build step, no data collected:
each learner's name and progress are saved in their own browser (localStorage).

- Live (GitHub Pages): link TBC
- Future address: learn.edcosys.com

## Folders
- `index.html` welcome page (name sign-in)
- `lesson-1-1.html` lesson hub; `station-*.html`, `case-detective.html`, `quiz.html` activities
- `data/course.json` lesson list and text
- `assets/css/tokens.css` brand colours and fonts (edit colours here only)
- `assets/js/store.js` saved progress (export ready for a future teacher dashboard)
- `assets/vendor/` third-party files with their licences (gpt-tokenizer: MIT; Nunito font used in the logo: OFL)

Pages are marked `noindex` so search engines don't list the portal before launch.
