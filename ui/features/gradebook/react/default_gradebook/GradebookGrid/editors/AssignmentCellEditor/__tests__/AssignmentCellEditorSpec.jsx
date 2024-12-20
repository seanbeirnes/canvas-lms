/*
 * Copyright (C) 2017 - present Instructure, Inc.
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

import ReactDOM from 'react-dom'
import AssignmentRowCellPropFactory from '../AssignmentRowCellPropFactory'
import AssignmentCellEditor from '../index'
import GridEvent from '../../../GridSupport/GridEvent'
import {createGradebook} from '../../../../__tests__/GradebookSpecHelper'
import fakeENV from '@canvas/test-utils/fakeENV'

QUnit.module('GradebookGrid AssignmentCellEditor', suiteHooks => {
  let $container
  let editor
  let editorOptions
  let gradebook
  let gridSupport

  function createEditor() {
    editor = new AssignmentCellEditor({...editorOptions, container: $container})
  }

  suiteHooks.beforeEach(() => {
    fakeENV.setup({
      GRADEBOOK_OPTIONS: {assignment_missing_shortcut: true},
    })
    $container = document.createElement('div')
    document.body.appendChild($container)

    gridSupport = {
      events: {
        onKeyDown: new GridEvent(),
      },
    }

    const assignment = {grading_type: 'points', id: '2301', points_possible: 10}
    gradebook = createGradebook()

    gradebook.students['1101'] = {id: '1101'}
    gradebook.setAssignments({2301: assignment})
    gradebook.updateSubmission({
      assignment_id: '2301',
      entered_grade: '7.8',
      entered_score: 7.8,
      excused: false,
      id: '2501',
      user_id: '1101',
    })

    sinon.stub(gradebook, 'isGradeEditable').withArgs('1101', '2301').returns(true)
    sinon.stub(gradebook, 'isGradeVisible').withArgs('1101', '2301').returns(true)

    editorOptions = {
      column: {
        assignmentId: '2301',
        field: 'assignment_2301',
        getGridSupport() {
          return gridSupport
        },
        object: assignment,
        propFactory: new AssignmentRowCellPropFactory(gradebook),
      },
      grid: {
        onKeyDown: {
          subscribe() {},
          unsubscribe() {},
        },
      },
      item: {
        // student row object
        id: '1101',
        assignment_2301: {
          // submission
          user_id: '1101',
        },
      },
    }
  })

  suiteHooks.afterEach(() => {
    if ($container.childNodes.length > 0) {
      editor.destroy()
    }
    $container.remove()
    fakeENV.teardown()
  })

  QUnit.module('initialization', hooks => {
    hooks.beforeEach(() => {
      sinon.spy(ReactDOM, 'render')
    })

    hooks.afterEach(() => {
      // eslint-disable-next-line no-restricted-properties
      ReactDOM.render.restore()
    })

    test('renders with React', () => {
      createEditor()
      // eslint-disable-next-line no-restricted-properties
      strictEqual(ReactDOM.render.callCount, 1)
    })

    test('renders an AssignmentRowCell', () => {
      createEditor()
      // eslint-disable-next-line no-restricted-properties
      const [element] = ReactDOM.render.lastCall.args
      equal(element.type.name, 'AssignmentRowCell')
    })

    test('renders a ReadOnlyCell when the grade is not editable', () => {
      gradebook.isGradeEditable.returns(false)
      createEditor()
      // eslint-disable-next-line no-restricted-properties
      const [element] = ReactDOM.render.lastCall.args
      equal(element.type.name, 'AssignmentRowCell')
    })

    test('renders into the given container', () => {
      createEditor()
      // eslint-disable-next-line no-restricted-properties
      const [, /* element */ container] = ReactDOM.render.lastCall.args
      strictEqual(container, $container)
    })

    test('stores a reference to the rendered AssignmentRowCell component', () => {
      createEditor()
      equal(editor.component.constructor.name, 'AssignmentRowCell')
    })

    test('includes editor options in AssignmentRowCell props', () => {
      createEditor()
      equal(editor.component.props.editorOptions, editor.options)
    })
  })

  QUnit.module('"onKeyDown" event', () => {
    test('calls .handleKeyDown on the AssignmentRowCell component when triggered', () => {
      createEditor()
      sinon.spy(editor.component, 'handleKeyDown')
      const keyboardEvent = new KeyboardEvent('example')
      gridSupport.events.onKeyDown.trigger(keyboardEvent)
      strictEqual(editor.component.handleKeyDown.callCount, 1)
    })

    test('passes the event when calling handleKeyDown', () => {
      createEditor()
      sinon.spy(editor.component, 'handleKeyDown')
      const keyboardEvent = new KeyboardEvent('example')
      gridSupport.events.onKeyDown.trigger(keyboardEvent)
      const [event] = editor.component.handleKeyDown.lastCall.args
      strictEqual(event, keyboardEvent)
    })

    test('returns the return value from the AssignmentRowCell component', () => {
      createEditor()
      sinon.stub(editor.component, 'handleKeyDown').returns(false)
      const keyboardEvent = new KeyboardEvent('example')
      const returnValue = gridSupport.events.onKeyDown.trigger(keyboardEvent)
      strictEqual(returnValue, false)
    })

    test('calls .handleKeyDown on the ReadOnlyCell component when grade is not editable', () => {
      gradebook.isGradeEditable.returns(false)
      createEditor()
      sinon.spy(editor.component, 'handleKeyDown')
      const keyboardEvent = new KeyboardEvent('example')
      gridSupport.events.onKeyDown.trigger(keyboardEvent)
      strictEqual(editor.component.handleKeyDown.callCount, 1)
    })
  })

  QUnit.module('#destroy()', () => {
    test('removes the reference to the AssignmentRowCell component', () => {
      createEditor()
      editor.destroy()
      strictEqual(editor.component, null)
    })

    test('unsubscribes from gridSupport.events.onKeyDown', () => {
      createEditor()
      editor.destroy()
      const keyboardEvent = new KeyboardEvent('example')
      const returnValue = gridSupport.events.onKeyDown.trigger(keyboardEvent)
      strictEqual(
        returnValue,
        true,
        '"true" is the default return value when the event has no subscribers'
      )
    })

    test('unmounts the AssignmentRowCell component', () => {
      createEditor()
      editor.destroy()
      const unmounted = ReactDOM.unmountComponentAtNode($container)
      strictEqual(unmounted, false, 'component was already unmounted')
    })
  })

  QUnit.module('#focus()', () => {
    test('calls .focus on the AssignmentRowCell component', () => {
      createEditor()
      sinon.spy(editor.component, 'focus')
      editor.focus()
      strictEqual(editor.component.focus.callCount, 1)
    })

    test('calls .focus on the ReadOnlyCell component when grade is not editable', () => {
      gradebook.isGradeEditable.returns(false)
      createEditor()
      sinon.spy(editor.component, 'focus')
      editor.focus()
      strictEqual(editor.component.focus.callCount, 1)
    })
  })

  QUnit.module('#isValueChanged()', () => {
    test('returns the result of calling .isValueChanged on the AssignmentRowCell component', () => {
      createEditor()
      sinon.stub(editor.component, 'isValueChanged').returns(true)
      strictEqual(editor.isValueChanged(), true)
    })

    test('calls .isValueChanged on the ReadOnlyCell component when the grade is not editable', () => {
      gradebook.isGradeEditable.returns(false)
      createEditor()
      sinon.stub(editor.component, 'isValueChanged').returns(true)
      strictEqual(editor.isValueChanged(), true)
    })

    test('returns false when the component has not yet rendered', () => {
      createEditor()
      editor.component = null
      strictEqual(editor.isValueChanged(), false)
    })
  })

  QUnit.module('#serializeValue()', () => {
    test('returns null', () => {
      createEditor()
      strictEqual(editor.serializeValue(), null)
    })
  })

  QUnit.module('#loadValue()', () => {
    test('renders the component', () => {
      createEditor()
      sinon.stub(editor, 'renderComponent')
      editor.loadValue()
      strictEqual(editor.renderComponent.callCount, 1)
    })
  })

  QUnit.module('#applyValue()', () => {
    test('calls .gradeSubmission on the AssignmentRowCell component', () => {
      createEditor()
      sinon.stub(editor.component, 'gradeSubmission')
      editor.applyValue({id: '1101'}, '9.7')
      strictEqual(editor.component.gradeSubmission.callCount, 1)
    })

    test('calls .gradeSubmission on the ReadOnlyCell component when the grade is not editable', () => {
      gradebook.isGradeEditable.returns(false)
      createEditor()
      sinon.stub(editor.component, 'gradeSubmission')
      editor.applyValue({id: '1101'}, '9.7')
      strictEqual(editor.component.gradeSubmission.callCount, 1)
    })

    test('includes the given item when applying the value', () => {
      createEditor()
      sinon.stub(editor.component, 'gradeSubmission')
      editor.applyValue({id: '1101'}, '9.7')
      const [item] = editor.component.gradeSubmission.lastCall.args
      deepEqual(item, {id: '1101'})
    })

    test('includes the given value when applying the value', () => {
      createEditor()
      sinon.stub(editor.component, 'gradeSubmission')
      editor.applyValue({id: '1101'}, '9.7')
      const [, /* item */ value] = editor.component.gradeSubmission.lastCall.args
      strictEqual(value, '9.7')
    })
  })

  QUnit.module('#validate()', () => {
    test('returns an empty validation success', () => {
      createEditor()
      deepEqual(editor.validate(), {msg: null, valid: true})
    })
  })
})
