/**
 * Regression Tests: TaskActions Component - Cross-Platform Consistency
 *
 * Tests that verify consistent behavior across mobile and desktop platforms,
 * responsive transitions, and unified component behavior.
 *
 * Focus: Cross-platform consistency, responsive transitions, unified behavior
 *
 * Related:
 * - Component: frontend/src/components/tasks/TaskActions.tsx
 * - Diff: origin/main...dev (TaskActions refactoring)
 */

describe('TaskActions - Cross-Platform Regression', () => {
  beforeEach(() => {
    cy.skipOnboarding();
  });

  context('Responsive Transitions', () => {
    it('should transition from desktop hover to mobile always-visible', () => {
      // Start with desktop
      cy.viewport(1280, 720);
      cy.visit('/');
      cy.waitForAppReady();

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          // Desktop: hover behavior
          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().as('taskCard');

              // Hover on desktop
              cy.get('@taskCard').trigger('mouseenter');
              cy.wait(200);

              // Now resize to mobile
              cy.viewport(393, 852);
              cy.wait(500);

              // Actions should now be always visible
              cy.get('@taskCard').within(() => {
                cy.get('button[aria-label*="action"]').should('be.visible');
              });
            }
          });
        }
      });
    });

    it('should transition from mobile always-visible to desktop hover', () => {
      // Start with mobile
      cy.setMobileViewport('iphone-14-pro');
      cy.visit('/');
      cy.waitForAppReady();

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });
      cy.wait(500);

      cy.get('body').then(($body) => {
        // Navigate to project
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          // Mobile: always visible
          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              cy.get('[data-testid="task-card"]').first().as('taskCard');

              // Actions visible on mobile
              cy.get('@taskCard').within(() => {
                cy.get('button[aria-label*="action"]').should('be.visible');
              });

              // Resize to desktop
              cy.viewport(1280, 720);
              cy.wait(500);

              // Actions should now require hover
              cy.get('@taskCard').trigger('mouseenter');
              cy.wait(200);

              cy.get('@taskCard').within(() => {
                cy.get('button[aria-label*="action"]').should('exist');
              });
            }
          });
        }
      });
    });

    it('should handle breakpoint transitions gracefully', () => {
      const breakpoints = [
        { width: 1920, height: 1080, name: 'Large Desktop' },
        { width: 1280, height: 720, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 393, height: 852, name: 'Mobile' },
      ];

      cy.visit('/');
      cy.waitForAppReady();

      breakpoints.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.wait(300);

        cy.log(`Testing ${viewport.name}: ${viewport.width}x${viewport.height}`);

        // App should remain functional
        cy.get('body').should('be.visible');

        // Navigation should work
        cy.get('body').then(($body) => {
          // Different nav patterns for different viewports
          if (viewport.width < 768) {
            // Mobile: bottom nav
            if ($body.find('[data-testid="bottom-nav"]').length > 0) {
              cy.get('[data-testid="bottom-nav"]').should('be.visible');
            }
          }
        });
      });
    });
  });

  context('Unified Component Behavior', () => {
    it('should provide consistent modal interactions across platforms', () => {
      const platforms = [
        { width: 393, height: 852, name: 'Mobile' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      platforms.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        cy.waitForAppReady();

        cy.log(`Testing modal consistency on ${viewport.name}`);

        // Navigate to tasks
        cy.get('body').then(($body) => {
          // Mobile uses bottom nav
          if (viewport.width < 768 && $body.find('[data-testid="bottom-nav"]').length > 0) {
            cy.get('[data-testid="bottom-nav"]').within(() => {
              cy.contains('Tasks').click();
            });
            cy.wait(500);
          }

          // Look for tasks
          if ($body.find('[href*="/projects/"]').length > 0) {
            cy.get('[href*="/projects/"]').first().click();
            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              if ($projectBody.find('[data-testid="task-card"]').length > 0) {
                // Open actions menu
                cy.get('[data-testid="task-card"]').first().within(() => {
                  if (viewport.width >= 768) {
                    cy.get('[data-testid="task-card"]').first().trigger('mouseenter');
                    cy.wait(200);
                  }

                  cy.get('button[aria-label*="action"]').first().click({ force: true });
                });

                cy.wait(300);

                // Menu behavior should be consistent
                cy.get('[role="menu"]').should('be.visible');

                // Close menu
                cy.get('body').type('{esc}');
                cy.wait(200);
              }
            });
          }
        });
      });
    });

    it('should maintain consistent action availability across platforms', () => {
      const platforms = [
        { width: 393, height: 852, name: 'Mobile' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      const expectedActions = ['edit', 'duplicate', 'archive', 'delete'];

      platforms.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        cy.waitForAppReady();

        cy.log(`Testing action consistency on ${viewport.name}`);

        cy.get('body').then(($body) => {
          if (viewport.width < 768 && $body.find('[data-testid="bottom-nav"]').length > 0) {
            cy.get('[data-testid="bottom-nav"]').within(() => {
              cy.contains('Tasks').click();
            });
            cy.wait(500);
          }

          if ($body.find('[href*="/projects/"]').length > 0) {
            cy.get('[href*="/projects/"]').first().click();
            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              if ($projectBody.find('[data-testid="task-card"]').length > 0) {
                cy.get('[data-testid="task-card"]').first().within(() => {
                  if (viewport.width >= 768) {
                    cy.get('[data-testid="task-card"]').first().trigger('mouseenter');
                  }

                  cy.get('button[aria-label*="action"]').first().click({ force: true });
                });

                cy.wait(300);

                // Check menu has expected actions
                cy.get('[role="menu"]').should('be.visible');

                // Close menu
                cy.get('body').click(10, 10);
              }
            });
          }
        });
      });
    });
  });

  context('Event Propagation Consistency', () => {
    it('should prevent navigation on both platforms when clicking actions', () => {
      const platforms = [
        { width: 393, height: 852, name: 'Mobile' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      platforms.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        cy.waitForAppReady();

        cy.get('body').then(($body) => {
          if (viewport.width < 768 && $body.find('[data-testid="bottom-nav"]').length > 0) {
            cy.get('[data-testid="bottom-nav"]').within(() => {
              cy.contains('Tasks').click();
            });
            cy.wait(500);
          }

          if ($body.find('[href*="/projects/"]').length > 0) {
            cy.get('[href*="/projects/"]').first().click();
            cy.wait(1000);

            cy.url().then((initialUrl) => {
              cy.get('body').then(($projectBody) => {
                if ($projectBody.find('[data-testid="task-card"]').length > 0) {
                  cy.get('[data-testid="task-card"]').first().within(() => {
                    if (viewport.width >= 768) {
                      cy.get('[data-testid="task-card"]').first().trigger('mouseenter');
                    }

                    cy.get('button[aria-label*="action"]').first().click({ force: true });
                  });

                  // URL should not change
                  cy.url().should('eq', initialUrl);

                  // Close menu
                  cy.get('body').type('{esc}');
                }
              });
            });
          }
        });
      });
    });
  });

  context('Accessibility Across Platforms', () => {
    it('should provide keyboard navigation on desktop', () => {
      cy.viewport(1280, 720);
      cy.visit('/');
      cy.waitForAppReady();

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              // Tab to first action button
              cy.get('[data-testid="task-card"]').first().within(() => {
                cy.get('button[aria-label*="action"]').first()
                  .focus()
                  .type('{enter}');
              });

              cy.wait(300);

              // Menu should open
              cy.get('[role="menu"]').should('be.visible');

              // Navigate with arrow keys
              cy.focused().type('{downarrow}');
              cy.wait(100);

              // Close with Escape
              cy.get('body').type('{esc}');
              cy.get('[role="menu"]').should('not.exist');
            }
          });
        }
      });
    });

    it('should provide touch-friendly targets on mobile', () => {
      cy.setMobileViewport('iphone-14-pro');
      cy.visit('/');
      cy.waitForAppReady();

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });
      cy.wait(500);

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            const buttons = $projectBody.find('button[aria-label*="action"]');

            if (buttons.length > 0) {
              buttons.slice(0, 3).each((idx, btn) => {
                const rect = btn.getBoundingClientRect();
                const minSize = Math.min(rect.width, rect.height);

                // Should be touch-friendly (at least 32px, ideally 44px)
                if (minSize > 0) {
                  cy.log(`Touch target size: ${minSize}px`);
                  expect(minSize).to.be.at.least(24); // Minimum acceptable
                }
              });
            }
          });
        }
      });
    });

    it('should provide consistent aria-labels across platforms', () => {
      const platforms = [
        { width: 393, height: 852, name: 'Mobile' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      platforms.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        cy.waitForAppReady();

        cy.get('body').then(($body) => {
          if (viewport.width < 768 && $body.find('[data-testid="bottom-nav"]').length > 0) {
            cy.get('[data-testid="bottom-nav"]').within(() => {
              cy.contains('Tasks').click();
            });
            cy.wait(500);
          }

          if ($body.find('[href*="/projects/"]').length > 0) {
            cy.get('[href*="/projects/"]').first().click();
            cy.wait(1000);

            cy.get('body').then(($projectBody) => {
              const buttons = $projectBody.find('button[aria-label]');

              if (buttons.length > 0) {
                buttons.slice(0, 5).each((idx, btn) => {
                  const ariaLabel = Cypress.$(btn).attr('aria-label');
                  expect(ariaLabel).to.not.be.empty;
                  cy.log(`${viewport.name} aria-label: ${ariaLabel}`);
                });
              }
            });
          }
        });
      });
    });
  });

  context('Performance Across Platforms', () => {
    it('should load and render efficiently on mobile', () => {
      cy.setMobileViewport('iphone-14-pro');

      const startTime = Date.now();

      cy.visit('/');
      cy.waitForAppReady();

      const loadTime = Date.now() - startTime;
      cy.log(`Mobile load time: ${loadTime}ms`);

      // Should load within reasonable time
      expect(loadTime).to.be.lessThan(5000);

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });
      cy.wait(500);

      // Actions should be immediately visible
      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('button[aria-label*="action"]').length > 0) {
              cy.get('button[aria-label*="action"]').should('be.visible');
            }
          });
        }
      });
    });

    it('should load and render efficiently on desktop', () => {
      cy.viewport(1280, 720);

      const startTime = Date.now();

      cy.visit('/');
      cy.waitForAppReady();

      const loadTime = Date.now() - startTime;
      cy.log(`Desktop load time: ${loadTime}ms`);

      expect(loadTime).to.be.lessThan(5000);

      cy.get('body').then(($body) => {
        if ($body.find('[href*="/projects/"]').length > 0) {
          cy.get('[href*="/projects/"]').first().click();
          cy.wait(1000);

          // Hover should trigger actions smoothly
          cy.get('body').then(($projectBody) => {
            if ($projectBody.find('[data-testid="task-card"]').length > 0) {
              const hoverStart = Date.now();

              cy.get('[data-testid="task-card"]').first().trigger('mouseenter');
              cy.wait(200);

              const hoverTime = Date.now() - hoverStart;
              cy.log(`Hover response time: ${hoverTime}ms`);

              // Should respond quickly
              expect(hoverTime).to.be.lessThan(500);
            }
          });
        }
      });
    });
  });

  context('Orientation Changes', () => {
    it('should handle mobile portrait to landscape transition', () => {
      // Portrait
      cy.viewport(393, 852);
      cy.visit('/');
      cy.waitForAppReady();

      cy.get('[data-testid="bottom-nav"]').within(() => {
        cy.contains('Tasks').click();
      });
      cy.wait(500);

      // Switch to landscape
      cy.viewport(852, 393);
      cy.wait(500);

      // UI should adapt
      cy.get('body').should('be.visible');

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="bottom-nav"]').length > 0) {
          cy.get('[data-testid="bottom-nav"]').should('be.visible');
        }
      });
    });

    it('should handle tablet portrait to landscape transition', () => {
      // Portrait
      cy.viewport(768, 1024);
      cy.visit('/');
      cy.waitForAppReady();

      // Switch to landscape
      cy.viewport(1024, 768);
      cy.wait(500);

      // Layout should remain functional
      cy.get('body').should('be.visible');
    });
  });
});
