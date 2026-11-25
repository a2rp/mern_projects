# Chapter 069 example: Build a controlled course-enrollment form

This example brings together controlled text fields, a select, a radio group, checkboxes, validation, accessible error messages, and form submission. It is a small client-side React example: it displays a confirmation but does not send data to a server.

## What it demonstrates

- React state as the source of truth for editable values.
- One change handler for different input types.
- Reading checkbox state from <code>checked</code> and text-like values from <code>value</code>.
- A form-level <code>onSubmit</code> handler.
- Validation errors connected to their fields.
- An accessible success message and a controlled reset action.

## React component

Save this as <code>App.jsx</code> in a React application:

~~~jsx
import { useState } from "react";
import "./App.css";

const initialForm = {
  fullName: "",
  email: "",
  track: "",
  learningMode: "",
  topics: [],
  experience: "",
  receiveUpdates: false,
};

const topicOptions = ["React", "Node.js", "MongoDB"];

function validateForm(form) {
  const nextErrors = {};

  if (!form.fullName.trim()) {
    nextErrors.fullName = "Enter your name.";
  }

  const email = form.email.trim();
  const simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    nextErrors.email = "Enter your email address.";
  } else if (!simpleEmailPattern.test(email)) {
    nextErrors.email = "Enter an email address in a recognizable format.";
  }

  if (!form.track) {
    nextErrors.track = "Choose a course track.";
  }

  if (!form.learningMode) {
    nextErrors.learningMode = "Choose a learning format.";
  }

  if (form.topics.length === 0) {
    nextErrors.topics = "Choose at least one topic.";
  }

  if (form.experience.trim().length < 20) {
    nextErrors.experience =
      "Add at least 20 characters so we understand your experience.";
  }

  return nextErrors;
}

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submittedForm, setSubmittedForm] = useState(null);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;

    setForm((currentForm) => {
      if (type === "checkbox" && name === "topics") {
        const topics = checked
          ? [...currentForm.topics, value]
          : currentForm.topics.filter((topic) => topic !== value);

        return { ...currentForm, topics };
      }

      if (type === "checkbox") {
        return { ...currentForm, [name]: checked };
      }

      return { ...currentForm, [name]: value };
    });

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });

    setSubmittedForm(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmittedForm(null);
      return;
    }

    setSubmittedForm({
      ...form,
      topics: [...form.topics],
    });
  }

  function handleReset() {
    setForm(initialForm);
    setErrors({});
    setSubmittedForm(null);
  }

  return (
    <main className="page">
      <section className="form-card" aria-labelledby="page-title">
        <p className="eyebrow">MERN learning path</p>
        <h1 id="page-title">Course enrollment</h1>
        <p className="intro">
          Tell us what you want to learn. Fields marked required must be
          completed before this example shows a confirmation.
        </p>

        <form onSubmit={handleSubmit} onReset={handleReset} noValidate>
          <div className="field">
            <label htmlFor="full-name">Full name <span aria-hidden="true">*</span></label>
            <input
              autoComplete="name"
              id="full-name"
              name="fullName"
              onChange={handleChange}
              value={form.fullName}
              required
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "full-name-error" : undefined
              }
            />
            <FieldError id="full-name-error" message={errors.fullName} />
          </div>

          <div className="field">
            <label htmlFor="email">Email address <span aria-hidden="true">*</span></label>
            <input
              autoComplete="email"
              id="email"
              name="email"
              onChange={handleChange}
              type="email"
              value={form.email}
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>

          <div className="field">
            <label htmlFor="track">Course track <span aria-hidden="true">*</span></label>
            <select
              id="track"
              name="track"
              onChange={handleChange}
              value={form.track}
              required
              aria-invalid={Boolean(errors.track)}
              aria-describedby={errors.track ? "track-error" : undefined}
            >
              <option value="">Choose a track</option>
              <option value="frontend">Frontend with React</option>
              <option value="backend">Backend with Node.js</option>
              <option value="full-stack">Full stack MERN</option>
            </select>
            <FieldError id="track-error" message={errors.track} />
          </div>

          <fieldset
            className="choice-group"
            aria-describedby={
              errors.learningMode ? "learning-mode-error" : undefined
            }
          >
            <legend>Preferred learning format <span aria-hidden="true">*</span></legend>
            <label className="choice">
              <input
                checked={form.learningMode === "self-paced"}
                name="learningMode"
                onChange={handleChange}
                type="radio"
                value="self-paced"
              />
              <span>Self-paced</span>
            </label>
            <label className="choice">
              <input
                checked={form.learningMode === "guided"}
                name="learningMode"
                onChange={handleChange}
                type="radio"
                value="guided"
              />
              <span>Guided sessions</span>
            </label>
            <FieldError
              id="learning-mode-error"
              message={errors.learningMode}
            />
          </fieldset>

          <fieldset
            className="choice-group"
            aria-describedby={errors.topics ? "topics-error" : undefined}
          >
            <legend>Topics you want to study <span aria-hidden="true">*</span></legend>
            {topicOptions.map((topic) => (
              <label className="choice" key={topic}>
                <input
                  checked={form.topics.includes(topic)}
                  name="topics"
                  onChange={handleChange}
                  type="checkbox"
                  value={topic}
                />
                <span>{topic}</span>
              </label>
            ))}
            <FieldError id="topics-error" message={errors.topics} />
          </fieldset>

          <div className="field">
            <label htmlFor="experience">
              What have you built or studied so far? <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="experience"
              name="experience"
              onChange={handleChange}
              rows={5}
              value={form.experience}
              required
              aria-invalid={Boolean(errors.experience)}
              aria-describedby={
                errors.experience
                  ? "experience-hint experience-error"
                  : "experience-hint"
              }
            />
            <p className="field-hint" id="experience-hint">
              Write at least 20 characters.
            </p>
            <FieldError
              id="experience-error"
              message={errors.experience}
            />
          </div>

          <label className="choice updates-choice">
            <input
              checked={form.receiveUpdates}
              name="receiveUpdates"
              onChange={handleChange}
              type="checkbox"
            />
            <span>Send me course updates</span>
          </label>

          <div className="actions">
            <button className="primary-button" type="submit">
              Review enrollment
            </button>
            <button className="secondary-button" type="reset">
              Clear form
            </button>
          </div>
        </form>

        {submittedForm && (
          <section className="confirmation" aria-live="polite">
            <h2>Enrollment details ready</h2>
            <p>
              Thanks, {submittedForm.fullName.trim()}. This demo validated the
              form and kept the submitted values in React state.
            </p>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>{submittedForm.email.trim()}</dd>
              </div>
              <div>
                <dt>Track</dt>
                <dd>{submittedForm.track}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{submittedForm.learningMode}</dd>
              </div>
              <div>
                <dt>Topics</dt>
                <dd>{submittedForm.topics.join(", ")}</dd>
              </div>
              <div>
                <dt>Course updates</dt>
                <dd>{submittedForm.receiveUpdates ? "Yes" : "No"}</dd>
              </div>
            </dl>
            <p className="next-step">
              A real application would send this data to a server, show the
              server's response, and handle network or server-side validation
              errors.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
~~~

## Stylesheet

Save this as <code>App.css</code> beside <code>App.jsx</code>:

~~~css
:root {
  font-family: system-ui, sans-serif;
  color: #182230;
  background: #f2f5f9;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

.page {
  display: grid;
  min-height: 100vh;
  padding: 2rem 1rem;
  place-items: start center;
}

.form-card {
  width: min(100%, 46rem);
  padding: clamp(1.25rem, 4vw, 2.5rem);
  border: 1px solid #d7deea;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 1rem 3rem rgb(24 34 48 / 10%);
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #485b83;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
p {
  overflow-wrap: anywhere;
}

h1 {
  margin: 0;
  font-size: clamp(1.8rem, 5vw, 2.5rem);
}

.intro {
  margin: 0.75rem 0 1.75rem;
  color: #526174;
  line-height: 1.6;
}

form,
.field {
  display: grid;
  gap: 0.55rem;
}

form {
  gap: 1.35rem;
}

label,
legend {
  font-weight: 650;
}

label span[aria-hidden="true"],
legend span[aria-hidden="true"] {
  color: #b42318;
}

input:not([type="checkbox"]):not([type="radio"]),
select,
textarea {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #aab5c4;
  border-radius: 0.45rem;
  color: inherit;
  background: #fff;
}

textarea {
  min-height: 8rem;
  resize: vertical;
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible {
  outline: 3px solid #7aa7ff;
  outline-offset: 2px;
}

[aria-invalid="true"] {
  border-color: #b42318 !important;
}

.choice-group {
  display: grid;
  gap: 0.7rem;
  margin: 0;
  padding: 1rem;
  border: 1px solid #d7deea;
  border-radius: 0.6rem;
}

.choice-group legend {
  padding: 0 0.25rem;
}

.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-weight: 450;
}

.choice input {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0.15rem 0 0;
  accent-color: #2459c4;
}

.field-hint,
.field-error {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
}

.field-hint {
  color: #526174;
}

.field-error {
  color: #b42318;
  font-weight: 600;
}

.updates-choice {
  padding-top: 0.15rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

button {
  min-height: 2.8rem;
  padding: 0.6rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.45rem;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  color: #fff;
  background: #1949a8;
}

.primary-button:hover {
  background: #123b8d;
}

.secondary-button {
  border-color: #aab5c4;
  color: #182230;
  background: #fff;
}

.secondary-button:hover {
  background: #f2f5f9;
}

.confirmation {
  margin-top: 2rem;
  padding: 1.25rem;
  border: 1px solid #9ac8a5;
  border-radius: 0.7rem;
  background: #f1fbf3;
}

.confirmation h2 {
  margin: 0;
}

.confirmation p {
  line-height: 1.55;
}

.confirmation dl {
  display: grid;
  gap: 0.7rem;
  margin: 1rem 0;
}

.confirmation dl div {
  display: grid;
  grid-template-columns: minmax(7rem, 0.4fr) 1fr;
  gap: 0.75rem;
}

.confirmation dt {
  font-weight: 700;
}

.confirmation dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.next-step {
  margin-bottom: 0;
}

@media (max-width: 30rem) {
  .page {
    padding: 0.75rem;
  }

  .actions {
    display: grid;
  }

  .confirmation dl div {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
~~~

## How the example works

1. <code>initialForm</code> gives every controlled field a defined initial value. Text-like fields start as strings, checkbox state starts as booleans, and the topic group starts as an array.
2. <code>handleChange</code> uses <code>checked</code> for checkboxes and <code>value</code> for text, select, and radio controls. For the topic checkboxes, it adds or removes the selected topic from an array.
3. Each input receives its current value or checked state from <code>form</code>. That state is updated immediately on each change.
4. <code>handleSubmit</code> prevents a page navigation, validates the current state, and stores a snapshot for the confirmation only when valid.
5. Field errors are rendered as text and referenced from the relevant input or fieldset. The success section announces its update through a polite live region.
6. The reset button resets both browser form behavior and the React state that owns the fields.

The email check and all other validation here are for demonstration. Client-side validation improves feedback but is not a security boundary. A production application must validate and authorize the data on its server, handle server errors, and protect any endpoint that accepts the submission.

## Common mistakes to avoid

- Rendering a controlled field without updating the state in its change handler.
- Reading a checkbox's selected state from <code>value</code> instead of <code>checked</code>.
- Giving each radio in one group a different name.
- Omitting labels or using duplicate ids.
- Forgetting to prevent the default form navigation when handling submission in React.
- Treating a browser-side validation result as proof that the submitted data is safe.
- Assuming this confirmation sends the form to a server; this example only updates local UI state.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [068 - Conditional rendering and lists](../lessons/068-conditional-rendering-and-lists.md) | [Q&A](../qnas/069-forms-and-controlled-inputs.md) | [070 - Share state by lifting it](../lessons/070-share-state-by-lifting-it.md) |
