/*!
Copyright (C) 2020 Evolved Binary

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable @typescript-eslint/no-unused-vars */

import Toastify, { Options } from 'toastify-js';
import { messageKeys } from '../config';

/**
 * Displays a toast message with 'Toastify' library
 *
 * @param message - Message to display
 * @param type - Type of toast
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  const toast = Toastify({
    text: message,
    duration: 10000,
    gravity: 'bottom',
    position: 'right',
    className: `toast toast--${type}`,
  }).showToast();
}

/**
 * Displays a customized Tostify message
 * with customized markup
 * that users can confirm to never show again
 * by storing it in the localStorage
 */
export const showWelcomeNote = () => {
  const customNote = document.createElement('section');
  customNote.innerHTML = `
  <h2>${messageKeys.welcomeNote.title}</h2>
  <p>${messageKeys.welcomeNote.paragraph1}</p>
  <p>${messageKeys.welcomeNote.paragraph2}</p>
  <button type="button" class="toast--dismiss">${messageKeys.welcomeNote.buttonLabel}</button>
  `;

  const parentNode = document.body;
  parentNode.appendChild(customNote);

  Toastify({
    text: '',
    duration: -1,
    gravity: 'top',
    position: 'right',
    className: 'toast toast--welcome',
    close: true,
    node: customNote,
    onClick: function () {
      const toastElement = document.querySelector('.toast--welcome');
      if (toastElement) {
        toastElement.remove();
        localStorage.setItem('welcomeNoteConfirmed', 'true');
      }
    }
  }).showToast();
};

/**
 * Checks if the welcome note has been confirmed
 * @returns True if the welcome note has been confirmed
 */
export function hasConfirmedNotification(): boolean {
  return localStorage.getItem('welcomeNoteConfirmed') === 'true';
}