document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.destaques_carrossel');
  if (!wrapper) {
    return;
  }

  const lista = wrapper.querySelector('.destaques_lista');
  const prevBtn = wrapper.querySelector('[data-direction="prev"]');
  const nextBtn = wrapper.querySelector('[data-direction="next"]');

  if (!lista || !prevBtn || !nextBtn) {
    return;
  }

  const updateArrows = () => {
    const maxScrollLeft = lista.scrollWidth - lista.clientWidth;
    prevBtn.disabled = lista.scrollLeft <= 4;
    nextBtn.disabled = lista.scrollLeft >= maxScrollLeft - 4;
    wrapper.classList.toggle('is-overflowing', lista.scrollWidth > lista.clientWidth + 1);
  };

  const scrollByStep = (direction) => {
    const primeiroCard = lista.querySelector('.destaque_card');
    const step = primeiroCard ? primeiroCard.getBoundingClientRect().width + 18 : lista.clientWidth * 0.8;
    lista.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  prevBtn.addEventListener('click', () => {
    scrollByStep(-1);
  });

  nextBtn.addEventListener('click', () => {
    scrollByStep(1);
  });

  lista.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', updateArrows);

  const observer = new MutationObserver(updateArrows);
  observer.observe(lista, { childList: true });

  updateArrows();
});
