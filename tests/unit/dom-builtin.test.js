import { test, expect, describe, beforeEach } from '@jest/globals';

// Test using Jest's built-in jsdom environment (no import needed)
describe('Built-in JSDOM Test', () => {
  beforeEach(() => {
    // Jest's jsdom environment provides document and window globals
    document.body.innerHTML = `
      <div id="test-element">Hello World</div>
      <button id="test-button">Click me</button>
      <div id="stringSetTextField">--</div>
      <div id="rootTextField">--</div>
      <div id="keyTextField">--</div>
      <div id="typeTextField">--</div>
    `;
  });

  test('should have DOM available', () => {
    expect(document).toBeTruthy();
    expect(window).toBeTruthy();
    expect(document.getElementById('test-element')).toBeTruthy();
  });

  test('should read element content', () => {
    const element = document.getElementById('test-element');
    expect(element.textContent).toBe('Hello World');
  });

  test('should modify element content', () => {
    const element = document.getElementById('test-element');
    element.textContent = 'Modified';
    expect(element.textContent).toBe('Modified');
  });

  test('should handle chord display fields', () => {
    const stringSetField = document.getElementById('stringSetTextField');
    const rootField = document.getElementById('rootTextField');
    const keyField = document.getElementById('keyTextField');
    const typeField = document.getElementById('typeTextField');

    expect(stringSetField.textContent).toBe('--');
    expect(rootField.textContent).toBe('--');
    expect(keyField.textContent).toBe('--');
    expect(typeField.textContent).toBe('--');

    // Simulate displaying a chord problem
    stringSetField.textContent = 'SS1';
    rootField.textContent = 'R/2';
    keyField.textContent = 'C';
    typeField.textContent = 'maj7';

    expect(stringSetField.textContent).toBe('SS1');
    expect(rootField.textContent).toBe('R/2');
    expect(keyField.textContent).toBe('C');
    expect(typeField.textContent).toBe('maj7');
  });

  test('should handle button interactions', () => {
    const button = document.getElementById('test-button');
    let clicked = false;
    
    button.addEventListener('click', () => {
      clicked = true;
    });
    
    button.click();
    expect(clicked).toBe(true);
  });

  test('should manipulate classes', () => {
    const element = document.getElementById('test-element');
    element.classList.add('test-class');
    expect(element.classList.contains('test-class')).toBe(true);
    
    element.classList.remove('test-class');
    expect(element.classList.contains('test-class')).toBe(false);
  });

  test('should handle form elements', () => {
    document.body.innerHTML = `
      <select id="keySelect">
        <option value="">Any</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>
    `;

    const select = document.getElementById('keySelect');
    expect(select.value).toBe('');
    
    select.value = 'C';
    expect(select.value).toBe('C');
  });
});