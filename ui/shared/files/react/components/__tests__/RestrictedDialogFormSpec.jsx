/*
 * Copyright (C) 2014 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import '@canvas/files/mockFilesENV'
import React from 'react'
import ReactDOM from 'react-dom'
import {Simulate} from 'react-dom/test-utils'
import $ from 'jquery'
import 'jquery-migrate'
import RestrictedDialogForm from '@canvas/files/react/components/RestrictedDialogForm'
import Folder from '@canvas/files/backbone/models/Folder'
import {mergeTimeAndDate} from '@instructure/moment-utils'

QUnit.module('RestrictedDialogForm Multiple Selected Items', {
  setup() {
    const props = {
      models: [
        new Folder({
          id: 1000,
          hidden: false,
        }),
        new Folder({
          id: 999,
          hidden: true,
        }),
      ],
    }
    // eslint-disable-next-line react/no-render-return-value, no-restricted-properties
    this.restrictedDialogForm = ReactDOM.render(
      <RestrictedDialogForm {...props} />,
      $('<div>').appendTo('#fixtures')[0]
    )
  },
  teardown() {
    $('#fixtures').empty()
  },
})

test('button is disabled but becomes enabled when you select an item', function () {
  equal(this.restrictedDialogForm.updateBtn.disabled, true, 'starts off as disabled')
  this.restrictedDialogForm.restrictedSelection.publishInput.checked = true
  Simulate.change(this.restrictedDialogForm.restrictedSelection.publishInput)
  equal(
    this.restrictedDialogForm.updateBtn.disabled,
    false,
    'is enabled after an option is selected'
  )
})

QUnit.module('RestrictedDialogForm#handleSubmit', {
  setup() {
    const props = {
      models: [
        new Folder({
          id: 999,
          hidden: true,
          lock_at: undefined,
          unlock_at: undefined,
        }),
      ],
    }
    // eslint-disable-next-line react/no-render-return-value, no-restricted-properties
    this.restrictedDialogForm = ReactDOM.render(
      <RestrictedDialogForm {...props} />,
      $('<div>').appendTo('#fixtures')[0]
    )
  },
  teardown() {
    $('#fixtures').empty()
  },
})

test('calls save on the model with only hidden if calendarOption is false', function () {
  const stubbedSave = sandbox.spy(this.restrictedDialogForm.props.models[0], 'save')
  Simulate.submit(this.restrictedDialogForm.dialogForm)
  ok(
    stubbedSave.calledWithMatch({}, {attrs: {hidden: true}}),
    'Called save with single hidden true attribute'
  )
})

// eslint-disable-next-line qunit/no-test-expect-argument
test(
  'calls save on the model with calendar should update hidden, unlock_at, lock_at and locked',
  1,
  function () {
    const refs = this.restrictedDialogForm
    this.restrictedDialogForm.restrictedSelection.setState({selectedOption: 'date_range'})
    const startDate = new Date(2016, 5, 1)
    const startTime = '5 AM'
    const endDate = new Date(2016, 5, 4)
    const endTime = '5 PM'
    $(refs.restrictedSelection.unlock_at).data('unfudged-date', startDate)
    $(refs.restrictedSelection.unlock_at_time).val(startTime)
    $(refs.restrictedSelection.lock_at).data('unfudged-date', endDate)
    $(refs.restrictedSelection.lock_at_time).val(endTime)
    const stubbedSave = sandbox.spy(this.restrictedDialogForm.props.models[0], 'save')
    Simulate.submit(refs.dialogForm)
    ok(
      stubbedSave.calledWithMatch(
        {},
        {
          attrs: {
            hidden: false,
            lock_at: mergeTimeAndDate(endTime, endDate),
            unlock_at: mergeTimeAndDate(startTime, startDate),
            locked: false,
          },
        }
      ),
      'Called save with lock_at, unlock_at and locked attributes'
    )
  }
)

test('accepts blank unlock_at date', function () {
  const refs = this.restrictedDialogForm
  this.restrictedDialogForm.restrictedSelection.setState({selectedOption: 'date_range'})
  const endDate = new Date(2016, 5, 4)
  const endTime = '5 PM'
  $(refs.restrictedSelection.unlock_at).data('unfudged-date', null)
  $(refs.restrictedSelection.unlock_at_time).val('')
  $(refs.restrictedSelection.lock_at).data('unfudged-date', endDate)
  $(refs.restrictedSelection.lock_at_time).val(endTime)
  const stubbedSave = sandbox.spy(this.restrictedDialogForm.props.models[0], 'save')
  Simulate.submit(refs.dialogForm)
  ok(
    stubbedSave.calledWithMatch(
      {},
      {
        attrs: {
          hidden: false,
          lock_at: mergeTimeAndDate(endTime, endDate),
          unlock_at: '',
          locked: false,
        },
      }
    ),
    'Accepts blank unlock_at date'
  )
})

test('accepts blank lock_at date', function () {
  const refs = this.restrictedDialogForm
  this.restrictedDialogForm.restrictedSelection.setState({selectedOption: 'date_range'})
  const startDate = new Date(2016, 5, 4)
  const startTime = '5 PM'
  $(refs.restrictedSelection.unlock_at).data('unfudged-date', startDate)
  $(refs.restrictedSelection.unlock_at_time).val(startTime)
  $(refs.restrictedSelection.lock_at).data('unfudged-date', null)
  $(refs.restrictedSelection.lock_at_time).val('')
  const stubbedSave = sandbox.spy(this.restrictedDialogForm.props.models[0], 'save')
  Simulate.submit(refs.dialogForm)
  ok(
    stubbedSave.calledWithMatch(
      {},
      {
        attrs: {
          hidden: false,
          lock_at: '',
          unlock_at: mergeTimeAndDate(startTime, startDate),
          locked: false,
        },
      }
    ),
    'Accepts blank lock_at date'
  )
})

test('rejects unlock_at date after lock_at date', function () {
  const refs = this.restrictedDialogForm
  this.restrictedDialogForm.restrictedSelection.setState({selectedOption: 'date_range'})
  const startDate = new Date(2016, 5, 4)
  const startTime = '5 AM'
  const endDate = new Date(2016, 5, 1)
  const endTime = '5 AM'
  $(refs.restrictedSelection.unlock_at).data('unfudged-date', startDate)
  $(refs.restrictedSelection.unlock_at_time).val(startTime)
  $(refs.restrictedSelection.lock_at).data('unfudged-date', endDate)
  $(refs.restrictedSelection.lock_at_time).val(endTime)
  const stubbedSave = sandbox.spy(this.restrictedDialogForm.props.models[0], 'save')
  Simulate.submit(refs.dialogForm)
  equal(stubbedSave.callCount, 0)
})
