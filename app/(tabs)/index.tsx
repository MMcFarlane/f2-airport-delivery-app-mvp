import { useState } from 'react';

import { PrimaryButton, Row, SecondaryButton } from '@/src/components/ui/Buttons';
import { FilterChip } from '@/src/components/ui/FilterChip';
import { MenuCard } from '@/src/components/ui/MenuCard';
import { RestaurantCard } from '@/src/components/ui/RestaurantCard';
import { Muted, Screen, SectionLabel } from '@/src/components/ui/Screen';

const chips = ['Fits my window', 'Under 10 min', 'Coffee', 'Burgers'] as const;

export default function HomeScreen() {
  const [selected, setSelected] = useState<(typeof chips)[number]>('Fits my window');
  const [added, setAdded] = useState(false);

  return (
    <Screen title="Theme">
      <Muted>
        Shared pieces for the later screens. Filters, cards, and buttons use the artboard colors.
      </Muted>

      <SectionLabel>Buttons</SectionLabel>
      <PrimaryButton label={added ? 'Added · $13.85' : 'Show me what I can get'} onPress={() => setAdded(true)} />
      <SecondaryButton label="Back to home" onPress={() => setAdded(false)} />

      <SectionLabel>Chips</SectionLabel>
      <Row>
        {chips.map((chip) => (
          <FilterChip
            key={chip}
            label={chip}
            selected={selected === chip}
            onPress={() => setSelected(chip)}
          />
        ))}
      </Row>

      <SectionLabel>Restaurant</SectionLabel>
      <RestaurantCard
        initials="RB"
        markColor="#FFC940"
        name="Runway Burger"
        detail="Burgers, fries, shakes · Near B9"
        status="Full menu available"
        minutes="8 MIN"
      />
      <RestaurantCard
        initials="CP"
        markColor="#F2B36B"
        name="Concourse Pizza"
        detail="Pizza, salads · Concourse A"
        status="Some items too slow for your flight"
        statusTone="late"
        minutes="24 MIN"
      />

      <SectionLabel>Menu</SectionLabel>
      <MenuCard
        name="Double smash burger"
        description="Two beef patties, American cheese, pickles, house sauce"
        price="$14.50"
        minutes="12 MIN"
        imageColor="#F2B36B"
        onAdd={() => setAdded(true)}
      />
      <MenuCard
        name="Smoked brisket platter"
        description="12-hour brisket, two sides, cornbread"
        price="$21.00"
        minutes="TOO LATE FOR 15:00"
        imageColor="#D4B08A"
        tooLate
      />
    </Screen>
  );
}
