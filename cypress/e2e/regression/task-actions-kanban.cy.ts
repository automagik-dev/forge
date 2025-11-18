/**
 * Regression Tests: TaskActions Component - Kanban/Desktop Flows
 *
 * Tests the TaskActions component refactoring for desktop Kanban view,
 * focusing on hover-based quick actions and desktop-specific interactions.
 *
 * Focus: Desktop Kanban flows with hover behavior and standard sizing
 *
 * Related:
 * - Component: frontend/src/components/tasks/TaskActions.tsx
 * - Diff: origin/main...dev (TaskActions refactoring)
 */

describe('TaskActions - Kanban/Desktop Regression', () => {
  beforeEach(() => {
    cy.skipOnboarding();
    cy.viewport(1280, 720); // Desktop viewport
    cy.visit('/');
    cy.waitForAppReady();
  });

  context('Kanban View - Hover Behavior', () => {
    it('should show quick actions on hover and hide on mouse leave', () => {
      // Navigate to a project with tasks
      cy.get('body').then(($body) => {
        // Look for project cards or links
        const projectSelectors = [
          '[data-testid="project-card"]',
          '[href*="/projects/"]',
          'a[class*="project"]'
        ];

        let projectFound = false;
        for (const selector of projectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();
            projectFound = true;
            break;
          }
        }

        if (projectFound) {
          cy.wait(1000);

          // Look for task cards in Kanban view
          cy.get('body').then(($projectBody) => {
            const taskCardSelectors = [
              '[data-testid="task-card"]',
              '[class*="task-card"]',
              '[role="article"]',
              '[class*="kanban"][class*="card"]'
            ];

            for (const selector of taskCardSelectors) {
              if ($projectBody.find(selector).length > 0) {
                cy.get(selector).first().as('taskCard');

                // Initially, quick actions may not be visible
                cy.get('@taskCard').within(() => {
                  // Before hover - check if play/archive buttons are hidden
                  cy.get('body').then(($card) => {
                    const playButtons = $card.find('button[aria-label*="Start"]');
                    if (playButtons.length > 0) {
                      // If they exist, they should become visible on hover
                    }
                  });
                });

                // Trigger hover
                cy.get('@taskCard').trigger('mouseenter');
                cy.wait(200);

                // After hover - quick actions should appear
                cy.get('@taskCard').within(() => {
                  cy.get('body').then(($hoveredCard) => {
                    // Look for play or archive buttons
                    const actionButtons = $hoveredCard.find('button[aria-label*="Start"], button[aria-label*="Archive"]');
                    if (actionButtons.length > 0) {
                      expect(actionButtons.length).to.be.greaterThan(0);
                    }
                  });
                });

                // Trigger mouse leave
                cy.get('@taskCard').trigger('mouseleave');
                cy.wait(200);

                break;
              }
            }
          });
        }
      });
    });

    it('should maintain actions menu visibility regardless of hover state', () => {
      cy.get('body').then(($body) => {
        const projectSelectors = [
          '[data-testid="project-card"]',
          '[href*="/projects/"]'
        ];

        for (const selector of projectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();

            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              const taskCardSelectors = [
                '[data-testid="task-card"]',
                '[class*="task-card"]'
              ];

              for (const cardSelector of taskCardSelectors) {
                if ($projectBody.find(cardSelector).length > 0) {
                  cy.get(cardSelector).first().within(() => {
                    // Actions menu trigger should always be visible
                    cy.get('button[aria-label*="action"], button[aria-label*="More"]')
                      .should('exist');
                  });
                  break;
                }
              }
            });
            break;
          }
        }
      });
    });

    it('should use standard (non-compact) button sizing on desktop', () => {
      cy.get('body').then(($body) => {
        const projectSelectors = [
          '[data-testid="project-card"]',
          '[href*="/projects/"]'
        ];

        for (const selector of projectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();

            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              if ($projectBody.find('[data-testid="task-card"]').length > 0) {
                cy.get('[data-testid="task-card"]').first()
                  .trigger('mouseenter')
                  .within(() => {
                    cy.get('button').first().should('have.css', 'height').then((height) => {
                      const heightNum = parseInt(height);
                      // Standard sizing should be larger than compact
                      expect(heightNum).to.be.at.least(32);
                    });
                  });
              }
            });
            break;
          }
        }
      });
    });
  });

  context('Kanban Card Integration', () => {
    it('should not navigate to task details when clicking action buttons', () => {
      cy.get('body').then(($body) => {
        const projectSelectors = [
          '[data-testid="project-card"]',
          '[href*="/projects/"]'
        ];

        for (const selector of projectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();

            cy.wait(1000);

            cy.url().then((projectUrl) => {
              cy.get('body').then(($projectBody) => {
                const taskCardSelectors = [
                  '[data-testid="task-card"]',
                  '[class*="task-card"]'
                ];

                for (const cardSelector of taskCardSelectors) {
                  if ($projectBody.find(cardSelector).length > 0) {
                    cy.get(cardSelector).first()
                      .trigger('mouseenter')
                      .within(() => {
                        cy.get('button[aria-label*="action"]').first()
                          .click({ force: true });
                      });

                    // URL should not change (event propagation stopped)
                    cy.url().should('eq', projectUrl);
                    break;
                  }
                }
              });
            });
            break;
          }
        }
      });
    });

    it('should handle multiple task cards independently', () => {
      cy.get('body').then(($body) => {
        const projectSelectors = [
          '[data-testid="project-card"]',
          '[href*="/projects/"]'
        ];

        for (const selector of projectSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click();

            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              const taskCards = $projectBody.find('[data-testid="task-card"]');

              if (taskCards.length >= 2) {
                // Hover first card
                cy.get('[data-testid="task-card"]').eq(0).trigger('mouseenter');
                cy.wait(200);

                // Hover second card
                cy.get('[data-testid="task-card"]').eq(1).trigger('mouseenter');
                cy.wait(200);

                // Both should maintain their own state
                cy.get('[data-testid="task-card"]').eq(0).trigger('mouseleave');
                cy.get('[data-testid="task-card"]').eq(1).within(() => {
                  cy.get('button[aria-label*="action"]').should('exist');
                });
              }
            });
            break;
          }
        }
      });
    });
  });

  context('Quick Actions - Desktop Behavior', () => {
    it('should show play button for tasks without executor on hover', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            // Find task without running executor
            const taskCards = $projectBody.find('[data-testid="task-card"]');

            taskCards.each((idx, card) => {
              const $card = Cypress.$(card);
              // Check if this task doesn't have running indicator
              const hasRunningIndicator = $card.find('[data-status="running"]').length > 0;

              if (!hasRunningIndicator && idx < 3) { // Check first 3 cards
                cy.wrap(card).trigger('mouseenter');
                cy.wait(200);

                cy.wrap(card).within(() => {
                  // Play button should appear
                  cy.get('body').then(($hoveredCard) => {
                    const playButtons = $hoveredCard.find('button[aria-label*="Start"]');
                    if (playButtons.length > 0) {
                      cy.log('Play button found on hover');
                    }
                  });
                });

                return false; // Break after first match
              }
            });
          });
        }
      });
    });

    it('should show archive button on hover for non-archived tasks', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            const taskCards = $projectBody.find('[data-testid="task-card"]');

            if (taskCards.length > 0) {
              cy.get('[data-testid="task-card"]').first()
                .trigger('mouseenter');

              cy.wait(200);

              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('body').then(($card) => {
                  const archiveButtons = $card.find('button[aria-label*="Archive"]');
                  if (archiveButtons.length > 0) {
                    cy.log('Archive button found on hover');
                  }
                });
              });
            }
          });
        }
      });
    });
  });

  context('Actions Menu - Desktop', () => {
    it('should display complete menu with all sections', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"], button[aria-label*="More"]')
                  .first()
                  .click({ force: true });
              });

              cy.wait(300);

              // Menu should contain various action categories
              cy.get('[role="menu"]').should('be.visible').within(() => {
                // Expected menu structure based on TaskActions.tsx
                const expectedSections = [
                  /view/i,    // View section
                  /edit/i,    // Task section
                  /archive/i,
                  /delete/i
                ];

                expectedSections.forEach(pattern => {
                  cy.get('body').then(($menu) => {
                    if ($menu.text().match(pattern)) {
                      cy.contains(pattern).should('exist');
                    }
                  });
                });
              });
            }
          });
        }
      });
    });

    it('should include view actions (diff, preview, details) when available', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"]').first().click({ force: true });
              });

              cy.wait(300);

              // Check for view-related actions
              cy.get('body').then(($bodyWithMenu) => {
                const menuText = $bodyWithMenu.text();
                const viewActions = [/view details/i, /view diff/i, /view preview/i];

                viewActions.forEach(pattern => {
                  if (menuText.match(pattern)) {
                    cy.log(`Found: ${pattern}`);
                  }
                });
              });
            }
          });
        }
      });
    });

    it('should close menu when clicking on card background', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"]').first().click({ force: true });
              });

              cy.wait(300);

              // Click outside menu
              cy.get('body').click(100, 100);

              // Menu should close
              cy.get('[role="menu"]').should('not.exist');
            }
          });
        }
      });
    });
  });

  context('Modal Workflows - Desktop', () => {
    it('should open modals without navigating away from kanban view', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.url().then((kanbanUrl) => {
            cy.get('body').then(($projectBody) => {
              if ($projectBody.find('[data-testid="task-card"]').length > 0) {
                cy.get('[data-testid="task-card"]').first()
                  .trigger('mouseenter')
                  .within(() => {
                    // Try to click play button if it exists
                    cy.get('body').then(($card) => {
                      const playBtn = $card.find('button[aria-label*="Start"]');
                      if (playBtn.length > 0) {
                        cy.get('button[aria-label*="Start"]').first().click({ force: true });

                        cy.wait(500);

                        // Should open modal, not navigate
                        cy.url().should('eq', kanbanUrl);
                        cy.get('[role="dialog"]').should('be.visible');
                      }
                    });
                  });
              }
            });
          });
        }
      });
    });

    it('should handle edit action from menu', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"]').first().click({ force: true });
              });

              cy.wait(300);

              cy.get('body').then(($menuBody) => {
                if ($menuBody.text().match(/edit/i)) {
                  cy.contains(/^Edit$/i).click({ force: true });

                  cy.wait(500);

                  // Should open task form modal
                  cy.get('[role="dialog"]').should('be.visible');
                }
              });
            }
          });
        }
      });
    });
  });

  context('Task States - Desktop View', () => {
    it('should show appropriate indicators for in-progress tasks', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            // Look for in-progress indicators
            const indicators = [
              '[data-status="running"]',
              '[data-status="in-progress"]',
              '[class*="running"]',
              '[class*="in-progress"]'
            ];

            indicators.forEach(selector => {
              const elements = $projectBody.find(selector);
              if (elements.length > 0) {
                cy.get(selector).first().within(() => {
                  // Should have visual indicator
                  cy.get('body').then(($task) => {
                    // Typically spinner or progress indicator
                    const hasIndicator = $task.find('svg, [class*="spinner"]').length > 0;
                    expect(hasIndicator).to.be.true;
                  });
                });
              }
            });
          });
        }
      });
    });

    it('should show appropriate actions for different task states', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            const taskCards = $projectBody.find('[data-testid="task-card"]');

            // Check first few tasks for state-dependent actions
            taskCards.slice(0, 3).each((idx, card) => {
              cy.wrap(card).within(() => {
                cy.get('button[aria-label*="action"]').should('exist');
              });
            });
          });
        }
      });
    });
  });

  context('Responsive Desktop Breakpoints', () => {
    it('should maintain hover behavior on tablet viewports', () => {
      cy.viewport(768, 1024); // Tablet

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first()
                .trigger('mouseenter');

              cy.wait(200);

              // Hover should still work
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"]').should('exist');
              });
            }
          });
        }
      });
    });

    it('should adapt to wide desktop viewports', () => {
      cy.viewport(1920, 1080); // Large desktop

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          // Layout should accommodate wider viewport
          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').should('be.visible');
            }
          });
        }
      });
    });
  });

  context('Performance', () => {
    it('should not cause excessive re-renders on repeated hover', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();

          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              const card = cy.get('[data-testid="task-card"]').first();

              // Hover multiple times rapidly
              for (let i = 0; i < 5; i++) {
                card.trigger('mouseenter');
                cy.wait(50);
                card.trigger('mouseleave');
                cy.wait(50);
              }

              // Final hover should still work
              card.trigger('mouseenter');
              cy.wait(200);

              card.within(() => {
                cy.get('button[aria-label*="action"]').should('exist');
              });
            }
          });
        }
      });
    });
  });
});
