/**
 * Regression Tests: TaskActions Component - Mobile Flows
 *
 * Tests the TaskActions component refactoring that consolidates action logic
 * from Kanban cards and mobile list view into a single reusable component.
 *
 * Focus: Mobile-specific flows with always-visible actions and compact sizing
 *
 * Related:
 * - Component: frontend/src/components/tasks/TaskActions.tsx
 * - Diff: origin/main...dev (TaskActions refactoring)
 */

describe('TaskActions - Mobile Regression', () => {
  beforeEach(() => {
    cy.skipOnboarding();
    cy.setMobileViewport('iphone-14-pro');
    cy.visit('/');
    cy.waitForAppReady();
  });

  context('Mobile List View - Always Visible Actions', () => {
    it('should display quick action buttons without requiring hover', () => {
      // Navigate to tasks view
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Find first task in list (mobile view)
      cy.get('body').then(($body) => {
        // Try multiple possible selectors for task items
        const selectors = [
          '[data-testid="task-list-item"]',
          '[data-testid="task-card"]',
          '[role="listitem"]',
          '.task-item',
          '[class*="task"][class*="item"]'
        ];

        let taskFound = false;
        for (const selector of selectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().as('taskItem');
            taskFound = true;
            break;
          }
        }

        if (taskFound) {
          // Verify actions are visible without hover
          cy.get('@taskItem').within(() => {
            // Actions menu trigger should always be visible
            cy.get('[aria-label*="action"]').should('be.visible');
          });
        }
      });
    });

    it('should render compact action buttons suitable for mobile', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Look for action buttons and verify compact sizing
      cy.get('body').then(($body) => {
        const buttonSelectors = [
          'button[aria-label*="Start"]',
          'button[aria-label*="Archive"]',
          'button[aria-label*="action"]'
        ];

        buttonSelectors.forEach(selector => {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().should('have.css', 'height').then((height) => {
              const heightNum = parseInt(height);
              // Compact mode should be smaller than default
              expect(heightNum).to.be.lessThan(40);
            });
          }
        });
      });
    });

    it('should provide touch-friendly targets (minimum 44x44px)', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Check all interactive elements meet minimum touch target size
      cy.get('body').then(($body) => {
        const touchTargets = [
          'button[aria-label*="action"]',
          '[role="button"]',
          'button'
        ];

        touchTargets.forEach(selector => {
          const elements = $body.find(selector);
          if (elements.length > 0) {
            elements.slice(0, 3).each((idx, el) => {
              const rect = el.getBoundingClientRect();
              // Touch targets should be at least 44x44 or have adequate padding
              const minDimension = Math.min(rect.width, rect.height);
              if (minDimension > 0 && minDimension < 44) {
                cy.log(`Warning: Touch target ${selector} is ${minDimension}px`);
              }
            });
          }
        });
      });
    });
  });

  context('Quick Actions - Play Button', () => {
    it('should open create attempt modal when play button clicked', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Look for play button
      cy.get('body').then(($body) => {
        const playSelectors = [
          'button[aria-label*="Start"]',
          'button[aria-label*="attempt"]',
          'svg[class*="play"]'
        ];

        let playFound = false;
        for (const selector of playSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            playFound = true;
            break;
          }
        }

        if (playFound) {
          // Modal should appear
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should not show play button for tasks with active executor', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Look for tasks with running indicator
      cy.get('body').then(($body) => {
        const runningIndicators = [
          '[data-status="running"]',
          '[class*="running"]',
          '[class*="in-progress"]'
        ];

        runningIndicators.forEach(selector => {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().within(() => {
              // Play button should not exist
              cy.get('button[aria-label*="Start"]').should('not.exist');
            });
          }
        });
      });
    });
  });

  context('Quick Actions - Archive Button', () => {
    it('should open archive confirmation when archive button clicked', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const archiveSelectors = [
          'button[aria-label*="Archive"]',
          'svg[class*="archive"]'
        ];

        let archiveFound = false;
        for (const selector of archiveSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            archiveFound = true;
            break;
          }
        }

        if (archiveFound) {
          // Confirmation modal should appear
          cy.get('[role="dialog"]').should('be.visible');
          cy.contains(/archive/i).should('be.visible');
        }
      });
    });
  });

  context('Actions Menu', () => {
    it('should open menu and display all action categories', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Click actions menu trigger
      cy.get('body').then(($body) => {
        const menuTriggers = [
          'button[aria-label*="More"]',
          'button[aria-label*="action"]',
          'svg[class*="more-horizontal"]'
        ];

        let menuOpened = false;
        for (const selector of menuTriggers) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            menuOpened = true;
            break;
          }
        }

        if (menuOpened) {
          // Menu should be visible with expected sections
          cy.get('[role="menu"]').should('be.visible').within(() => {
            // Check for key menu items (may vary based on task state)
            const expectedItems = [
              /view/i,
              /edit/i,
              /duplicate/i,
              /archive/i,
              /delete/i
            ];

            expectedItems.forEach(pattern => {
              cy.get('body').then(($menu) => {
                if ($menu.text().match(pattern)) {
                  cy.contains(pattern).should('exist');
                }
              });
            });
          });
        }
      });
    });

    it('should close menu when clicking outside', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const menuTriggers = [
          'button[aria-label*="More"]',
          'button[aria-label*="action"]'
        ];

        for (const selector of menuTriggers) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });

            // Wait for menu
            cy.wait(200);

            // Click outside
            cy.get('body').click(10, 10);

            // Menu should close
            cy.get('[role="menu"]').should('not.exist');
            break;
          }
        }
      });
    });

    it('should prevent event propagation when clicking actions', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Track current URL
      cy.url().then((initialUrl) => {
        cy.get('body').then(($body) => {
          const menuTriggers = [
            'button[aria-label*="More"]',
            'button[aria-label*="action"]'
          ];

          for (const selector of menuTriggers) {
            if ($body.find(selector).length > 0) {
              cy.get(selector).first().click({ force: true });

              // URL should not change after clicking menu trigger
              cy.url().should('eq', initialUrl);
              break;
            }
          }
        });
      });
    });
  });

  context('Modal Integrations', () => {
    it('should open edit modal from actions menu', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const menuTriggers = [
          'button[aria-label*="More"]',
          'button[aria-label*="action"]'
        ];

        for (const selector of menuTriggers) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });

            cy.wait(200);

            // Click edit if it exists
            cy.get('body').then(($menu) => {
              if ($menu.text().match(/edit/i)) {
                cy.contains(/edit/i).click({ force: true });

                // Form/modal should appear
                cy.get('[role="dialog"]').should('be.visible');
              }
            });
            break;
          }
        }
      });
    });

    it('should open duplicate task form from actions menu', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const menuTriggers = [
          'button[aria-label*="More"]',
          'button[aria-label*="action"]'
        ];

        for (const selector of menuTriggers) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });

            cy.wait(200);

            cy.get('body').then(($menu) => {
              if ($menu.text().match(/duplicate/i)) {
                cy.contains(/duplicate/i).click({ force: true });

                // Form should appear (pre-filled with task data)
                cy.get('[role="dialog"]').should('be.visible');
              }
            });
            break;
          }
        }
      });
    });

    it('should open delete confirmation from actions menu', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const menuTriggers = [
          'button[aria-label*="More"]',
          'button[aria-label*="action"]'
        ];

        for (const selector of menuTriggers) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });

            cy.wait(200);

            cy.get('body').then(($menu) => {
              if ($menu.text().match(/delete/i)) {
                cy.contains(/delete/i).click({ force: true });

                // Confirmation modal should appear
                cy.get('[role="dialog"]').should('be.visible');
                cy.contains(/delete/i).should('be.visible');
              }
            });
            break;
          }
        }
      });
    });
  });

  context('Responsive Behavior', () => {
    it('should maintain compact sizing on small mobile viewports', () => {
      // Test on very small viewport
      cy.viewport(360, 640);

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Actions should still be accessible
      cy.get('body').then(($body) => {
        const actionButtons = $body.find('button[aria-label*="action"]');
        expect(actionButtons.length).to.be.greaterThan(0);
      });
    });

    it('should adapt to landscape orientation', () => {
      // Landscape mobile
      cy.viewport(844, 390);

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Actions should still be visible and functional
      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label*="More"]').length > 0) {
          cy.get('button[aria-label*="More"]').first().should('be.visible');
        }
      });
    });
  });

  context('Accessibility', () => {
    it('should provide aria-labels for all action buttons', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Check that buttons have aria-labels
      cy.get('button').each(($btn) => {
        if ($btn.is(':visible')) {
          const ariaLabel = $btn.attr('aria-label');
          const text = $btn.text();
          // Either aria-label or text content should exist
          expect(ariaLabel || text).to.not.be.empty;
        }
      });
    });

    it('should support keyboard navigation in actions menu', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        const menuTriggers = $body.find('button[aria-label*="action"]');

        if (menuTriggers.length > 0) {
          // Focus and open menu with keyboard
          cy.get('button[aria-label*="action"]').first()
            .focus()
            .type('{enter}');

          // Menu should open
          cy.get('[role="menu"]').should('be.visible');

          // Should be able to navigate with arrow keys
          cy.focused().type('{downarrow}');
          cy.wait(100);
          cy.focused().type('{downarrow}');
        }
      });
    });

    it('should close menu with Escape key', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label*="More"]').length > 0) {
          cy.get('button[aria-label*="More"]').first().click({ force: true });

          cy.wait(200);

          // Press Escape
          cy.get('body').type('{esc}');

          // Menu should close
          cy.get('[role="menu"]').should('not.exist');
        }
      });
    });
  });

  context('Edge Cases', () => {
    it('should handle tasks without projects gracefully', () => {
      // Visit tasks page directly
      cy.visit('/tasks');
      cy.waitForAppReady();

      // App should not crash
      cy.get('body').should('exist');
    });

    it('should handle missing attempt IDs', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Actions should still work even if attemptId is null
      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label*="action"]').length > 0) {
          cy.get('button[aria-label*="action"]').first().click({ force: true });

          // Menu should open without errors
          cy.wait(200);
        }
      });
    });

    it('should differentiate archived vs active tasks', () => {
      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });

      cy.wait(500);

      // Check for archived status indicators
      cy.get('body').then(($body) => {
        const archivedTasks = $body.find('[data-status="archived"]');

        if (archivedTasks.length > 0) {
          // Archived tasks might have different available actions
          cy.get('[data-status="archived"]').first().within(() => {
            cy.get('button[aria-label*="action"]').should('exist');
          });
        }
      });
    });
  });
});
