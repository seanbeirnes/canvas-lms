/*
 * Copyright (C) 2016 - present Instructure, Inc.
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

import React from 'react'
import ReactDOM from 'react-dom'
import {Simulate} from 'react-dom/test-utils'
import _ from 'lodash'
import Dropdown from '../EnrollmentTermsDropdown'
import sinon from 'sinon'

const ok = x => expect(x).toBeTruthy()
const equal = (x, y) => expect(x).toEqual(y)

const container = document.createElement('div')
container.setAttribute('id', 'fixtures')
document.body.appendChild(container)

const wrapper = document.getElementById('fixtures')

function terms() {
  return [
    {
      id: '18',
      name: 'Fall 2013 - Art',
      startAt: new Date('2013-08-03T02:57:42.000Z'),
      endAt: new Date('2013-11-03T02:57:53.000Z'),
      createdAt: new Date('2013-07-27T16:51:41.000Z'),
      gradingPeriodGroupId: '3',
      displayName: 'Fall 2013 - Art',
    },
    {
      id: '21',
      name: 'Winter 2013 - Art',
      startAt: new Date('2013-12-03T02:57:42.000Z'),
      endAt: new Date('2014-01-21T02:57:53.000Z'),
      createdAt: new Date('2013-08-27T16:51:41.000Z'),
      gradingPeriodGroupId: '3',
      displayName: 'Winter 2013 - Art',
    },
    {
      id: '2',
      name: null,
      startAt: null,
      endAt: new Date('2013-10-21T02:57:53.000Z'),
      createdAt: new Date('2013-08-22T16:51:41.000Z'),
      gradingPeriodGroupId: '2',
      displayName: 'Term starting Sep 3, 2013',
    },
    {
      id: '7',
      name: null,
      startAt: null,
      endAt: null,
      createdAt: new Date('2013-08-23T16:51:41.000Z'),
      gradingPeriodGroupId: '2',
      displayName: 'Term created Aug 23, 2013',
    },
  ]
}

function renderComponent() {
  const props = {
    terms: terms(),
    changeSelectedEnrollmentTerm: sinon.spy(),
  }
  const element = React.createElement(Dropdown, props)
  // eslint-disable-next-line react/no-render-return-value, no-restricted-properties
  return ReactDOM.render(element, wrapper)
}

describe('EnrollmentTermsDropdown', () => {
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(wrapper)
  })

  test('includes an option for each term plus an option for "all terms"', function () {
    const dropdown = renderComponent()
    const expectedOptionsCount = terms().length + 1
    const node = ReactDOM.findDOMNode(dropdown.refs.termsDropdown)
    equal(node.length, expectedOptionsCount)
  })

  test('starts by showing all enrollment terms', function () {
    const dropdown = renderComponent()
    const node = ReactDOM.findDOMNode(dropdown.refs.termsDropdown)
    const ALL_TERMS_ID = '0'
    equal(node.value, ALL_TERMS_ID)
  })

  test('calls changeSelectedEnrollmentTerm when a selection is made', function () {
    const dropdown = renderComponent()
    const node = ReactDOM.findDOMNode(dropdown.refs.termsDropdown)
    node.value = '3'
    Simulate.change(node)
    ok(dropdown.props.changeSelectedEnrollmentTerm.calledOnce)
  })

  test("displays the terms in descending order by start date then created date if start date doesn't exist", function () {
    const dropdown = renderComponent()
    const node = ReactDOM.findDOMNode(dropdown.refs.termsDropdown)
    const optionIDs = _.map(node.getElementsByTagName('OPTION'), 'value')
    equal(optionIDs, ['0', '21', '18', '7', '2'])
  })
})
